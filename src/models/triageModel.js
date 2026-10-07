// Lógica de banco para Triagens (fila de atendimento).

import prisma from '../../db.js';
import { TRIAGE_STATUS } from '../constants/hospital.js';

// Traz o paciente e o médico junto
const includeRelations = {
  patients: { select: { id_patients_pk: true, name: true, cpf: true, birth_date: true } },
  doctors: { select: { id_doctors_pk: true, name: true, crm_number: true, crm_state: true } }
};

export const getAllTriages = async () => {
  return await prisma.triages.findMany({
    include: includeRelations,
    orderBy: { arrived_at: 'desc' }
  });
};

export const getTriageById = async (id) => {
  return await prisma.triages.findUnique({
    where: { id_triages_pk: Number(id) },
    include: includeRelations
  });
};

// Triagens com determinado status (ex.: WAITING = fila)
export const getTriagesByStatus = async (status) => {
  return await prisma.triages.findMany({
    where: { status },
    include: includeRelations
  });
};

// Triagem ainda aberta (aguardando ou em atendimento) de um paciente
export const getOpenTriageByPatient = async (patientId) => {
  return await prisma.triages.findFirst({
    where: {
      patients_id_fk: Number(patientId),
      status: { in: [TRIAGE_STATUS.WAITING, TRIAGE_STATUS.IN_PROGRESS] }
    }
  });
};

// Atendimento em andamento de um médico
export const getInProgressTriageByDoctor = async (doctorId) => {
  return await prisma.triages.findFirst({
    where: {
      doctors_id_fk: Number(doctorId),
      status: TRIAGE_STATUS.IN_PROGRESS
    }
  });
};

export const createTriage = async (data) => {
  return await prisma.triages.create({ data });
};

export const updateTriage = async (id, data) => {
  return await prisma.triages.update({
    where: { id_triages_pk: Number(id) },
    data
  });
};
