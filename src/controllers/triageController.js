import * as triageModel from '../models/triageModel.js';
import * as patientModel from '../models/patientModel.js';
import * as doctorModel from '../models/doctorModel.js';
import * as shiftModel from '../models/shiftModel.js';
import { createTriageService } from '../services/triageService.js';

const triageService = createTriageService({ triageModel, patientModel, doctorModel, shiftModel });

const responderErro = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    message: status === 500 ? "Erro interno no servidor." : error.message,
    ...(status === 500 && { detalhe: error.message })
  });
};

// 1. Registrar triagem (a prioridade é calculada automaticamente)
export const createTriage = async (req, res) => {
  try {
    const triage = await triageService.createTriage(req.body);
    return res.status(201).json(triage);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 2. Listar todas as triagens
export const getTriages = async (req, res) => {
  try {
    const triages = await triageService.listTriages();
    return res.status(200).json(triages);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 3. Ver a fila de espera ordenada por prioridade, com SLA
export const getQueue = async (req, res) => {
  try {
    const queue = await triageService.getQueue();
    return res.status(200).json(queue);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 4. Buscar triagem por ID
export const getTriageById = async (req, res) => {
  try {
    const triage = await triageService.getTriageById(Number(req.params.id));
    return res.status(200).json(triage);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 5. Médico chama o próximo paciente da fila
export const callNext = async (req, res) => {
  try {
    const triage = await triageService.callNext(req.body.doctors_id_fk);
    return res.status(200).json({ message: "Paciente chamado para atendimento.", data: triage });
  } catch (error) {
    return responderErro(res, error);
  }
};

// 6. Finalizar atendimento
export const finishTriage = async (req, res) => {
  try {
    const triage = await triageService.finishTriage(Number(req.params.id));
    return res.status(200).json({ message: "Atendimento finalizado.", data: triage });
  } catch (error) {
    return responderErro(res, error);
  }
};
