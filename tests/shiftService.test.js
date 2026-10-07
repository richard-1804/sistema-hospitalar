import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createShiftService } from '../src/services/shiftService.js';
import { createShiftData } from './factories/hospitalFactory.js';

describe('ShiftService', () => {
  let shiftService;
  let mockShiftModel;
  let mockDoctorModel;

  // Injecao de Mocks e Setup
  beforeEach(() => {
    mockShiftModel = {
      getShiftsByDoctor: jest.fn(),
      createShift: jest.fn(),
    };
    mockDoctorModel = {
      getDoctorById: jest.fn(),
    };

    // Cria o servico injetando os dois mocks necessarios
    shiftService = createShiftService({
      shiftModel: mockShiftModel,
      doctorModel: mockDoctorModel,
    });
  });

  it('deve criar um plantão com sucesso quando os horarios e o medico forem validos', async () => {
    const shiftData = createShiftData({
      doctors_id_fk: 1,
      start_time: '2026-10-07T07:00:00.000Z',
      end_time: '2026-10-07T19:00:00.000Z',
    });

    // Simula medico existente e ativo
    mockDoctorModel.getDoctorById.mockResolvedValue({ id: 1, is_active: true });
    // Simula que o medico nao tem outros plantees
    mockShiftModel.getShiftsByDoctor.mockResolvedValue([]);
    mockShiftModel.createShift.mockResolvedValue(shiftData);

    const result = await shiftService.createShift(shiftData);

    expect(result).toEqual(shiftData);
  });

  it('deve lançar erro se a duração do plantão exceder 24 horas', async () => {
    const longShift = createShiftData({
      doctors_id_fk: 1,
      start_time: '2026-10-07T07:00:00.000Z',
      end_time: '2026-10-08T10:00:00.000Z', // 27 horas
    });

    mockDoctorModel.getDoctorById.mockResolvedValue({ id: 1, is_active: true });

    await expect(shiftService.createShift(longShift)).rejects.toThrow(
      'O plantão não pode ter mais de 24 horas.'
    );
  });

  it('deve lançar erro em caso de choque de horários para o mesmo médico', async () => {
    const existingShift = {
      id_shifts_pk: 10,
      start_time: '2026-10-07T07:00:00.000Z',
      end_time: '2026-10-07T19:00:00.000Z',
    };

    const overlappingShift = createShiftData({
      doctors_id_fk: 1,
      start_time: '2026-10-07T12:00:00.000Z',
      end_time: '2026-10-07T22:00:00.000Z',
    });

    mockDoctorModel.getDoctorById.mockResolvedValue({ id: 1, is_active: true });
    mockShiftModel.getShiftsByDoctor.mockResolvedValue([existingShift]);

    await expect(shiftService.createShift(overlappingShift)).rejects.toThrow(
      'Choque de plantão: o médico já possui plantão neste horário.'
    );
  });
});
