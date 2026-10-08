import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createDoctorService } from '../src/services/doctorService.js';
import { createDoctorData } from './factories/hospitalFactory.js';

describe('doctorService', () => {
  let doctorService;
  let mockDoctorModel;

  beforeEach(() => {
    mockDoctorModel = {
      getDoctorByCrm: jest.fn(),
      createDoctor: jest.fn(),
      getAllDoctors: jest.fn(),
      getDoctorById: jest.fn(),
      updateDoctor: jest.fn(),
      deleteDoctor: jest.fn()
    };

    // Chamada correta da função fábrica (sem 'new' e passando 'doctorModel')
    doctorService = createDoctorService({ doctorModel: mockDoctorModel });
  });

  // teste de fluxo central 1 --------------------------------------------------------------------

  // Detecta a validade do CRM e da UF inseridos no sistema
  
  it('deve cadastrar um médico com sucesso quando um CRM e UF forem válidos', async () => {
    // Garante que a factory devolve crm_number e crm_state válidos
    const doctorData = createDoctorData({
      crm_number: '123456',
      crm_state: 'SP'
    });

    mockDoctorModel.getDoctorByCrm.mockResolvedValue(null);
    mockDoctorModel.createDoctor.mockResolvedValue({ id_doctors_pk: 1, ...doctorData });

    const result = await doctorService.registerDoctor(doctorData);

    expect(result).toBeDefined();
    expect(mockDoctorModel.createDoctor).toHaveBeenCalled();
  });

  // teste de digitos repetidos 2 ----------------------------------------------------------------

  // Bloqueia CRM's com dígitos repetidos inseridos no sistema

  it('deve lançar erro ao tentar cadastrar CRM com dígitos repetidos (ex: 111111)', async () => {
    const invalidDoctor = createDoctorData({ crm_number: '111111' });
    await expect(doctorService.registerDoctor(invalidDoctor)).rejects.toThrow();
  });

  // teste de CRM duplicado 3 --------------------------------------------------------------------

  // Bloqueia CRM's já cadastrados anteriormente no sistema

  it('deve lançar erro ao tentar cadastrar um CRM já existente no banco', async () => {
    const doctorData = createDoctorData();
    mockDoctorModel.getDoctorByCrm.mockResolvedValue(doctorData);
    await expect(doctorService.registerDoctor(doctorData)).rejects.toThrow();
  });


  it('deve listar todos os médicos', async () => {
    mockDoctorModel.getAllDoctors.mockResolvedValue([{ id: 1, name: 'Dr. Silva' }]);
    const result = await doctorService.getAllDoctors();
    expect(result).toHaveLength(1);
    expect(mockDoctorModel.getAllDoctors).toHaveBeenCalled();
  });

  it('deve buscar médico por ID', async () => {
    mockDoctorModel.getDoctorById.mockResolvedValue({ id: 1, name: 'Dr. Silva' });
    const result = await doctorService.getDoctorById(1);
    expect(result).toBeDefined();
    expect(mockDoctorModel.getDoctorById).toHaveBeenCalledWith(1);
  });

  it('deve atualizar os dados de um médico', async () => {
    mockDoctorModel.getDoctorById.mockResolvedValue({ id: 1, name: 'Dr. Silva' });
    mockDoctorModel.updateDoctor.mockResolvedValue({ id: 1, name: 'Dr. Silva Editado' });

    const result = await doctorService.updateDoctor(1, { name: 'Dr. Silva Editado' });
    expect(result).toBeDefined();
    expect(mockDoctorModel.updateDoctor).toHaveBeenCalled();
  });

  it('deve deletar/desativar um médico', async () => {
    mockDoctorModel.getDoctorById.mockResolvedValue({ id: 1, name: 'Dr. Silva' });
    mockDoctorModel.deleteDoctor.mockResolvedValue(true);

    const result = await doctorService.deleteDoctor(1);
    expect(result).toBe(true);
    expect(mockDoctorModel.deleteDoctor).toHaveBeenCalledWith(1);
  });
});
