// Lógica de banco para Plantões (listar, buscar por ID, buscar por médico, plantão ativo, criar, editar e deletar).

import prisma from '../../db.js';

export const getAllShifts = async () => {
  return await prisma.shifts.findMany({
    include: { doctors: { select: { id_doctors_pk: true, name: true, crm_number: true, crm_state: true } } },
    orderBy: { start_time: 'asc' }
  });
};

export const getShiftById = async (id) => {
  return await prisma.shifts.findUnique({
    where: { id_shifts_pk: Number(id) },
    include: { doctors: { select: { id_doctors_pk: true, name: true, crm_number: true, crm_state: true } } }
  });
};

// Todos os plantões de um médico (usado para detectar choque de horário)
export const getShiftsByDoctor = async (doctorId) => {
  return await prisma.shifts.findMany({
    where: { doctors_id_fk: Number(doctorId) }
  });
};

// Plantão que está acontecendo AGORA para o médico (início <= agora < fim)
export const getActiveShiftByDoctor = async (doctorId, now) => {
  return await prisma.shifts.findFirst({
    where: {
      doctors_id_fk: Number(doctorId),
      start_time: { lte: now },
      end_time: { gt: now }
    }
  });
};

export const createShift = async (data) => {
  return await prisma.shifts.create({ data });
};

export const updateShift = async (id, data) => {
  return await prisma.shifts.update({
    where: { id_shifts_pk: Number(id) },
    data
  });
};

export const deleteShift = async (id) => {
  return await prisma.shifts.delete({
    where: { id_shifts_pk: Number(id) }
  });
};
