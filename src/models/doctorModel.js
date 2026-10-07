// Lógica de banco para Médicos (listar, buscar por ID, buscar por CRM, criar, editar e deletar).

import prisma from '../../db.js';

export const getAllDoctors = async () => {
  return await prisma.doctors.findMany({
    orderBy: { name: 'asc' }
  });
};

export const getDoctorById = async (id) => {
  return await prisma.doctors.findUnique({
    where: { id_doctors_pk: Number(id) }
  });
};

// Usado para impedir dois médicos com o mesmo CRM (número + UF)
export const getDoctorByCrm = async (crm_number, crm_state) => {
  return await prisma.doctors.findFirst({
    where: { crm_number, crm_state }
  });
};

export const createDoctor = async (data) => {
  return await prisma.doctors.create({ data });
};

export const updateDoctor = async (id, data) => {
  return await prisma.doctors.update({
    where: { id_doctors_pk: Number(id) },
    data
  });
};

export const deleteDoctor = async (id) => {
  return await prisma.doctors.delete({
    where: { id_doctors_pk: Number(id) }
  });
};
