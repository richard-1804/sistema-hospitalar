import * as shiftModel from '../models/shiftModel.js';
import * as doctorModel from '../models/doctorModel.js';
import { createShiftService } from '../services/shiftService.js';

const shiftService = createShiftService({ shiftModel, doctorModel });

const responderErro = (res, error) => {
  const status = error.status || 500;
  return res.status(status).json({
    message: status === 500 ? "Erro interno no servidor." : error.message,
    ...(status === 500 && { detalhe: error.message })
  });
};

// 1. Listar plantões
export const getShifts = async (req, res) => {
  try {
    const shifts = await shiftService.listShifts();
    return res.status(200).json(shifts);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 2. Buscar plantão por ID
export const getShiftById = async (req, res) => {
  try {
    const shift = await shiftService.getShiftById(Number(req.params.id));
    return res.status(200).json(shift);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 3. Criar plantão (bloqueia choque de horário)
export const createShift = async (req, res) => {
  try {
    const shift = await shiftService.createShift(req.body);
    return res.status(201).json(shift);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 4. Atualizar horário do plantão (bloqueia choque de horário)
export const updateShift = async (req, res) => {
  try {
    const shift = await shiftService.updateShift(Number(req.params.id), req.body);
    return res.status(200).json(shift);
  } catch (error) {
    return responderErro(res, error);
  }
};

// 5. Deletar plantão
export const deleteShift = async (req, res) => {
  try {
    await shiftService.removeShift(Number(req.params.id));
    return res.status(200).json({ message: "Plantão removido com sucesso." });
  } catch (error) {
    return responderErro(res, error);
  }
};
