import * as doctorModel from '../models/doctorModel.js';
import { createDoctorService } from '../services/doctorService.js';

// Liga o service aos models reais (nos testes, o service recebe models falsos)
const doctorService = createDoctorService({ doctorModel });

// Erros das regras de negócio trazem "status" (404, 409, 422...); qualquer outro vira 500
const responderErro = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    message: status === 500 ? "Erro interno no servidor." : error.message,
    ...(status === 500 && { detalhe: error.message })
  });
};

// 1. Listar médicos
export const getDoctors = async (req, res) => {
  try {
    const doctors = await doctorService.listDoctors();
    return res.status(200).json(doctors);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 2. Buscar médico por ID
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(Number(req.params.id));
    return res.status(200).json(doctor);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 3. Cadastrar médico (valida o CRM)
export const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.registerDoctor(req.body);
    return res.status(201).json(doctor);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 4. Atualizar médico
export const updateDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.updateDoctor(Number(req.params.id), req.body);
    return res.status(200).json(doctor);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 5. Deletar médico
export const deleteDoctor = async (req, res) => {
  try {
    await doctorService.removeDoctor(Number(req.params.id));
    return res.status(200).json({ message: "Médico removido com sucesso." });
  } catch (error) {
    return responderErro(res, error);
  }
};
