import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createTriageService, classifyPriority } from '../src/services/triageService.js';
import { PRIORITY, TRIAGE_STATUS } from '../src/constants/hospital.js';

describe('Testes de triagem de pacientes', () => {
  // Mocks das dependências (Models)
  let triageModel, patientModel, doctorModel, shiftModel;
  let service;
  
  // Data base fixada para os testes: 10/05/2026 10:00:00
  const BASE_DATE = new Date('2026-05-10T10:00:00.000Z');
  let mockNow = new Date(BASE_DATE);

  beforeEach(() => {
    mockNow = new Date(BASE_DATE);

    triageModel = {
      getPatientById: jest.fn(),
      getOpenTriageByPatient: jest.fn(),
      createTriage: jest.fn(),
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

    // Instancia o serviço com relógio controlável via mock
    service = createTriageService({
      triageModel,
      patientModel,
      doctorModel,
      shiftModel,
      clock: () => mockNow
    });
  });

  // =========================================================================
  // REGRA 1: Classificação de Prioridade (Manchester) e Atribuição de SLA
  // =========================================================================
  describe('1. Classificação de Prioridade e SLA', () => {
    test.each([
      [{ is_unconscious: true }, 'RED'],
      [{ has_severe_bleeding: true }, 'RED'],
      [{ oxygen_saturation: 88 }, 'RED'],
      [{ heart_rate: 35 }, 'RED'],
      [{ heart_rate: 160 }, 'RED'],
      [{ oxygen_saturation: 92 }, 'ORANGE'],
      [{ temperature: 40.5 }, 'ORANGE'],
      [{ pain_level: 8 }, 'ORANGE'],
      [{ temperature: 38.6 }, 'YELLOW'],
      [{ heart_rate: 120 }, 'YELLOW'],
      [{ pain_level: 5 }, 'YELLOW'],
      [{ temperature: 37.9 }, 'GREEN'],
      [{ pain_level: 3 }, 'GREEN'],
      [{ temperature: 36.5, heart_rate: 80, oxygen_saturation: 98, pain_level: 0 }, 'BLUE']
    ])('deve classificar %p como prioridade %s', (vitals, expectedPriority) => {
      expect(classifyPriority(vitals)).toBe(PRIORITY[expectedPriority].name);
    });
  });

  // =========================================================================
  // REGRA 2: Criação da Triagem e Entrada Ordenada na Fila (com SLA)
  // =========================================================================
  describe('2. Criação e Fila de Atendimento Ordenada (getQueue)', () => {
    test('deve criar a triagem com dados corretos, status WAITING e horário atual', async () => {
      const patientData = {
        patients_id_fk: 1,
        symptoms: 'Falta de ar',
        oxygen_saturation: 88 // RED
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

    test('deve ordenar a fila por gravidade (rank) e depois por ordem de chegada (arrived_at)', async () => {
      const mockTriages = [
        { id: 1, priority: 'GREEN', arrived_at: new Date('2026-05-10T09:30:00Z') }, // Chegou mais cedo, mas é menos grave
        { id: 2, priority: 'RED', arrived_at: new Date('2026-05-10T09:50:00Z') },   // Mais grave (deve subir para 1º)
        { id: 3, priority: 'RED', arrived_at: new Date('2026-05-10T09:40:00Z') }    // Tão grave quanto ID 2, mas chegou antes
      ];

      triageModel.getTriagesByStatus.mockResolvedValue(mockTriages);

      const queue = await service.getQueue();

      // Ordem esperada:
      // 1. ID 3 (RED - 09:40)
      // 2. ID 2 (RED - 09:50)
      // 3. ID 1 (GREEN - 09:30)
      expect(queue.map(t => t.id)).toEqual([3, 2, 1]);
    });

    test('deve calcular corretamente minutes_waiting e identificar is_sla_breached = true', async () => {
      // Cria uma triagem RED (supondo SLA de 10 minutos) que chegou há 15 minutos
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
  // REGRA 3: Validação de Plantão Ativo ao Chamar Paciente (callNext)
  // =========================================================================
  describe('3. Validação de Plantão Ativo para Médicos', () => {
    test('deve lançar erro 422 se o médico NÃO estiver em plantão ativo', async () => {
      doctorModel.getDoctorById.mockResolvedValue({ id: 99, is_active: true });
      shiftModel.getActiveShiftByDoctor.mockResolvedValue(null); // Fora de plantão

      await expect(service.callNext(99)).rejects.toMatchObject({
        message: 'Médico fora de plantão: não é possível chamar pacientes.',
        status: 422
      });

      expect(shiftModel.getActiveShiftByDoctor).toHaveBeenCalledWith(99, BASE_DATE);
      expect(triageModel.updateTriage).not.toHaveBeenCalled();
    });

    test('deve permitir chamar o próximo paciente se o médico estive em plantão ativo', async () => {
      const doctorId = 99;
      doctorModel.getDoctorById.mockResolvedValue({ id: doctorId, is_active: true });
      shiftModel.getActiveShiftByDoctor.mockResolvedValue({ id: 50, doctor_id: doctorId });
      triageModel.getInProgressTriageByDoctor.mockResolvedValue(null);

      // Simula paciente aguardando na fila
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
});
