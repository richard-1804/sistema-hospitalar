import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createTriageService, classifyPriority } from '../src/services/triageService.js';
import { PRIORITY, TRIAGE_STATUS } from '../src/constants/hospital.js';

describe('Testes de triagem de pacientes', () => {
  let triageModel, patientModel, doctorModel, shiftModel;
  let service;

  const BASE_DATE = new Date('2026-05-10T10:00:00.000Z');
  let mockNow = new Date(BASE_DATE);

  beforeEach(() => {
    mockNow = new Date(BASE_DATE);

    triageModel = {
      getPatientById: jest.fn(),
      getOpenTriageByPatient: jest.fn(),
      createTriage: jest.fn(),
      getAllTriages: jest.fn(),
      getTriageById: jest.fn(),
      getTriagesByStatus: jest.fn(),
      getInProgressTriageByDoctor: jest.fn(),
      updateTriage: jest.fn()
    };

    patientModel = {
      getPatientById: jest.fn()
    };

    doctorModel = {
      getDoctorById: jest.fn()
    };

    shiftModel = {
      getActiveShiftByDoctor: jest.fn()
    };

    service = createTriageService({
      triageModel,
      patientModel,
      doctorModel,
      shiftModel,
      clock: () => mockNow
    });
  });

  // =========================================================================
  // 1. Classificação de Prioridade (Manchester)
  // =========================================================================
  describe('1. Classificação de Prioridade e SLA', () => {
    test.each([
      [{ is_unconscious: true }, 'RED'],
      [{ has_severe_bleeding: true }, 'RED'],
      [{ oxygen_saturation: 88 }, 'RED'],
      [{ heart_rate: 35 }, 'RED'],
      [{ heart_rate: 160 }, 'RED'],
      [{ oxygen_saturation: 92 }, 'ORANGE'],
      [{ temperature: 40.0 }, 'ORANGE'],
      [{ temperature: 34.9 }, 'ORANGE'],
      [{ heart_rate: 135 }, 'ORANGE'],
      [{ pain_level: 8 }, 'ORANGE'],
      [{ temperature: 38.5 }, 'YELLOW'],
      [{ heart_rate: 120 }, 'YELLOW'],
      [{ pain_level: 5 }, 'YELLOW'],
      [{ temperature: 37.8 }, 'GREEN'],
      [{ pain_level: 3 }, 'GREEN'],
      [{ temperature: 36.5, heart_rate: 80, oxygen_saturation: 98, pain_level: 0 }, 'BLUE']
    ])('deve classificar %p como prioridade %s', (vitals, expectedPriority) => {
      expect(classifyPriority(vitals)).toBe(PRIORITY[expectedPriority].name);
    });
  });

  // =========================================================================
  // 2. Método createTriage
  // =========================================================================
  describe('2. Método createTriage', () => {
    test('deve criar a triagem com dados corretos e valor padrão de booleanos', async () => {
      const patientData = {
        patients_id_fk: 1,
        symptoms: 'Falta de ar',
        oxygen_saturation: 88
      };

      patientModel.getPatientById.mockResolvedValue({ id: 1, name: 'João' });
      triageModel.getOpenTriageByPatient.mockResolvedValue(null);
      triageModel.createTriage.mockImplementation(async (data) => ({ id: 101, ...data }));

      const result = await service.createTriage(patientData);

      expect(patientModel.getPatientById).toHaveBeenCalledWith(1);
      expect(triageModel.createTriage).toHaveBeenCalledWith({
        patients_id_fk: 1,
        symptoms: 'Falta de ar',
        temperature: undefined,
        heart_rate: undefined,
        oxygen_saturation: 88,
        pain_level: undefined,
        is_unconscious: false,
        has_severe_bleeding: false,
        priority: PRIORITY.RED.name,
        status: TRIAGE_STATUS.WAITING,
        arrived_at: BASE_DATE
      });
      expect(result.priority).toBe(PRIORITY.RED.name);
    });

    test('deve lançar erro 404 se o paciente não for encontrado', async () => {
      patientModel.getPatientById.mockResolvedValue(null);

      await expect(service.createTriage({ patients_id_fk: 999 })).rejects.toMatchObject({
        message: 'Paciente não encontrado.',
        status: 404
      });
    });

    test('deve lançar erro 409 se o paciente já possuir triagem em aberto', async () => {
      patientModel.getPatientById.mockResolvedValue({ id: 1 });
      triageModel.getOpenTriageByPatient.mockResolvedValue({ id: 50, status: TRIAGE_STATUS.WAITING });

      await expect(service.createTriage({ patients_id_fk: 1 })).rejects.toMatchObject({
        message: 'Este paciente já possui uma triagem em aberto.',
        status: 409
      });
    });
  });

  // =========================================================================
  // 3. Métodos de Consulta: listTriages, getTriageById e getQueue
  // =========================================================================
  describe('3. Métodos de Consulta', () => {
    test('deve listar todas as triagens em listTriages', async () => {
      const mockList = [{ id: 1 }, { id: 2 }];
      triageModel.getAllTriages.mockResolvedValue(mockList);

      const result = await service.listTriages();
      expect(result).toEqual(mockList);
      expect(triageModel.getAllTriages).toHaveBeenCalledTimes(1);
    });

    test('deve retornar a triagem por ID em getTriageById', async () => {
      const mockTriage = { id: 10, status: TRIAGE_STATUS.WAITING };
      triageModel.getTriageById.mockResolvedValue(mockTriage);

      const result = await service.getTriageById(10);
      expect(result).toEqual(mockTriage);
      expect(triageModel.getTriageById).toHaveBeenCalledWith(10);
    });

    test('deve lançar erro 404 em getTriageById se a triagem não existir', async () => {
      triageModel.getTriageById.mockResolvedValue(null);

      await expect(service.getTriageById(999)).rejects.toMatchObject({
        message: 'Triagem não encontrada.',
        status: 404
      });
    });

    test('deve ordenar a fila em getQueue por gravidade e horário de chegada', async () => {
      const mockTriages = [
        { id: 1, priority: 'GREEN', arrived_at: new Date('2026-05-10T09:30:00Z') },
        { id: 2, priority: 'RED', arrived_at: new Date('2026-05-10T09:50:00Z') },
        { id: 3, priority: 'RED', arrived_at: new Date('2026-05-10T09:40:00Z') }
      ];

      triageModel.getTriagesByStatus.mockResolvedValue(mockTriages);

      const queue = await service.getQueue();
      expect(queue.map(t => t.id)).toEqual([3, 2, 1]);
    });

    test('deve calcular minutes_waiting e identificar is_sla_breached corretamente', async () => {
      const arrivedAt = new Date(BASE_DATE.getTime() - 15 * 60 * 1000);

      triageModel.getTriagesByStatus.mockResolvedValue([
        { id: 1, priority: 'RED', arrived_at: arrivedAt }
      ]);

      const queue = await service.getQueue();
      expect(queue[0].minutes_waiting).toBe(15);
      expect(queue[0].is_sla_breached).toBe(true);
    });
  });

  // =========================================================================
  // 4. Fluxo do Atendimento: callNext
  // =========================================================================
  describe('4. Método callNext', () => {
    test('deve lançar erro 404 se o médico não existir', async () => {
      doctorModel.getDoctorById.mockResolvedValue(null);

      await expect(service.callNext(999)).rejects.toMatchObject({
        message: 'Médico não encontrado.',
        status: 404
      });
    });

    test('deve lançar erro 422 se o médico estiver inativo', async () => {
      doctorModel.getDoctorById.mockResolvedValue({ id: 99, is_active: false });

      await expect(service.callNext(99)).rejects.toMatchObject({
        message: 'Médico inativo não pode realizar atendimentos.',
        status: 422
      });
    });

    test('deve lançar erro 422 se o médico NÃO estiver em plantão ativo', async () => {
      doctorModel.getDoctorById.mockResolvedValue({ id: 99, is_active: true });
      shiftModel.getActiveShiftByDoctor.mockResolvedValue(null);

      await expect(service.callNext(99)).rejects.toMatchObject({
        message: 'Médico fora de plantão: não é possível chamar pacientes.',
        status: 422
      });
    });

    test('deve lançar erro 409 se o médico já tiver atendimento em andamento', async () => {
      doctorModel.getDoctorById.mockResolvedValue({ id: 99, is_active: true });
      shiftModel.getActiveShiftByDoctor.mockResolvedValue({ id: 10 });
      triageModel.getInProgressTriageByDoctor.mockResolvedValue({ id: 55 });

      await expect(service.callNext(99)).rejects.toMatchObject({
        message: 'O médico já possui um atendimento em andamento.',
        status: 409
      });
    });

    test('deve lançar erro 404 se a fila de espera estiver vazia', async () => {
      doctorModel.getDoctorById.mockResolvedValue({ id: 99, is_active: true });
      shiftModel.getActiveShiftByDoctor.mockResolvedValue({ id: 10 });
      triageModel.getInProgressTriageByDoctor.mockResolvedValue(null);
      triageModel.getTriagesByStatus.mockResolvedValue([]);

      await expect(service.callNext(99)).rejects.toMatchObject({
        message: 'Não há pacientes aguardando atendimento.',
        status: 404
      });
    });

    test('deve chamar o próximo paciente com sucesso quando todas as validações passarem', async () => {
      const doctorId = 99;
      doctorModel.getDoctorById.mockResolvedValue({ id: doctorId, is_active: true });
      shiftModel.getActiveShiftByDoctor.mockResolvedValue({ id: 50 });
      triageModel.getInProgressTriageByDoctor.mockResolvedValue(null);

      const waitingTriage = { id_triages_pk: 10, priority: 'RED', arrived_at: BASE_DATE };
      triageModel.getTriagesByStatus.mockResolvedValue([waitingTriage]);
      triageModel.updateTriage.mockResolvedValue({ ...waitingTriage, status: TRIAGE_STATUS.IN_PROGRESS });

      const result = await service.callNext(doctorId);

      expect(triageModel.updateTriage).toHaveBeenCalledWith(10, {
        status: TRIAGE_STATUS.IN_PROGRESS,
        doctors_id_fk: doctorId,
        called_at: BASE_DATE
      });
      expect(result.status).toBe(TRIAGE_STATUS.IN_PROGRESS);
    });
  });

  // =========================================================================
  // 5. Fluxo de Encerramento: finishTriage
  // =========================================================================
  describe('5. Método finishTriage', () => {
    test('deve lançar erro 422 se o atendimento não estiver em andamento', async () => {
      triageModel.getTriageById.mockResolvedValue({ id: 10, status: TRIAGE_STATUS.WAITING });

      await expect(service.finishTriage(10)).rejects.toMatchObject({
        message: 'Apenas atendimentos em andamento podem ser finalizados.',
        status: 422
      });
    });

    test('deve finalizar o atendimento com sucesso e atualizar finished_at', async () => {
      triageModel.getTriageById.mockResolvedValue({ id: 10, status: TRIAGE_STATUS.IN_PROGRESS });
      triageModel.updateTriage.mockResolvedValue({ id: 10, status: TRIAGE_STATUS.FINISHED });

      const result = await service.finishTriage(10);

      expect(triageModel.updateTriage).toHaveBeenCalledWith(10, {
        status: TRIAGE_STATUS.FINISHED,
        finished_at: BASE_DATE
      });
      expect(result.status).toBe(TRIAGE_STATUS.FINISHED);
    });
  });
});
