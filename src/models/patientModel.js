// Lógica de banco para Pacientes (listar, buscar por ID, buscar por CPF, criar, editar e deletar).

import prisma from '../../db.js';

export const getAllPatients = async () => {
  return await prisma.patients.findMany({
    orderBy: { name: 'asc' }
  });
};

export const getPatientById = async (id) => {
  return await prisma.patients.findUnique({
    where: { id_patients_pk: Number(id) }
  });
};

export const getPatientByCpf = async (cpf) => {
  return await prisma.patients.findUnique({
    where: { cpf }
  });
};

export const createPatient = async (data) => {
  return await prisma.patients.create({ data });
};

export const updatePatient = async (id, data) => {
  return await prisma.patients.update({
    where: { id_patients_pk: Number(id) },
    data
  });
};

export const deletePatient = async (id) => {
  return await prisma.patients.delete({
    where: { id_patients_pk: Number(id) }
  });
};
