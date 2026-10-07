// Regras de negócio dos Médicos, principalmente a validação do CRM.
//
// Regras do CRM (número + UF):
//   - número com 4 a 7 dígitos (somente números)
//   - número não pode ter todos os dígitos iguais (ex.: 000000, 111111)
//   - UF precisa existir (SP, RJ, BA...) - aceita minúscula e converte para maiúscula
//   - não pode existir outro médico com o mesmo CRM + UF

import { VALID_STATES } from '../constants/hospital.js';

// Cria um erro com código HTTP (o controller usa o "status" para responder)
const erro = (message, status) => Object.assign(new Error(message), { status });

// Função pura: valida e devolve o CRM normalizado { crm_number, crm_state }
export const validateCrm = (crmNumber, crmState) => {
  const number = String(crmNumber ?? '').trim();
  const state = String(crmState ?? '').trim().toUpperCase();

  if (!/^\d{4,7}$/.test(number)) {
    throw erro('CRM inválido: o número deve ter de 4 a 7 dígitos.', 422);
  }

  if (/^(\d)\1+$/.test(number)) {
    throw erro('CRM inválido: número com todos os dígitos iguais.', 422);
  }

  if (!VALID_STATES.includes(state)) {
    throw erro('CRM inválido: UF inexistente.', 422);
  }

  return { crm_number: number, crm_state: state };
};

export const createDoctorService = ({ doctorModel }) => {

  const registerDoctor = async ({ name, crm_number, crm_state, specialty, is_active }) => {
    const crm = validateCrm(crm_number, crm_state);

    const existing = await doctorModel.getDoctorByCrm(crm.crm_number, crm.crm_state);
    if (existing) {
      throw erro('Já existe um médico cadastrado com este CRM.', 409);
    }

    return await doctorModel.createDoctor({
      name,
      specialty,
      ...crm,
      ...(is_active !== undefined && { is_active })
    });
  };

  const listDoctors = async () => {
    return await doctorModel.getAllDoctors();
  };

  const getDoctorById = async (id) => {
    const doctor = await doctorModel.getDoctorById(id);
    if (!doctor) {
      throw erro('Médico não encontrado.', 404);
    }
    return doctor;
  };

  const updateDoctor = async (id, data) => {
    const doctor = await getDoctorById(id); // lança 404 se não existir
    const payload = { ...data };

    // Só revalida o CRM se o número ou a UF foram enviados
    if (data.crm_number !== undefined || data.crm_state !== undefined) {
      const crm = validateCrm(
        data.crm_number ?? doctor.crm_number,
        data.crm_state ?? doctor.crm_state
      );

      const existing = await doctorModel.getDoctorByCrm(crm.crm_number, crm.crm_state);
      if (existing && existing.id_doctors_pk !== id) {
        throw erro('Já existe um médico cadastrado com este CRM.', 409);
      }

      Object.assign(payload, crm);
    }

    return await doctorModel.updateDoctor(id, payload);
  };

  const removeDoctor = async (id) => {
    await getDoctorById(id); // lança 404 se não existir
    await doctorModel.deleteDoctor(id);
  };

  return { registerDoctor, listDoctors, getDoctorById, updateDoctor, removeDoctor };
};
