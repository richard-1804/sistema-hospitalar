import * as patientModel from '../models/patientModel.js';

// CRUD simples de pacientes (sem regras complexas, então não precisa de service)

// 1. Listar pacientes
export const getPatients = async (req, res) => {
  try {
    const patients = await patientModel.getAllPatients();
    return res.status(200).json(patients);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar pacientes.", error: error.message });
  }
};

// 2. Buscar paciente por ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await patientModel.getPatientById(Number(req.params.id));
    if (!patient) {
      return res.status(404).json({ message: "Paciente não encontrado." });
    }
    return res.status(200).json(patient);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao buscar paciente.", error: error.message });
  }
};

// 3. Cadastrar paciente
export const createPatient = async (req, res) => {
  try {
    const existing = await patientModel.getPatientByCpf(req.body.cpf);
    if (existing) {
      return res.status(409).json({ message: "Já existe um paciente com este CPF." });
    }

    const newPatient = await patientModel.createPatient(req.body);
    return res.status(201).json(newPatient);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao cadastrar paciente.", error: error.message });
  }
};

// 4. Atualizar paciente
export const updatePatient = async (req, res) => {
  try {
    const patientId = Number(req.params.id);

    const patient = await patientModel.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Paciente não encontrado." });
    }

    if (req.body.cpf) {
      const sameCpf = await patientModel.getPatientByCpf(req.body.cpf);
      if (sameCpf && sameCpf.id_patients_pk !== patientId) {
        return res.status(409).json({ message: "Já existe um paciente com este CPF." });
      }
    }

    const updatedPatient = await patientModel.updatePatient(patientId, req.body);
    return res.status(200).json(updatedPatient);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao atualizar paciente.", error: error.message });
  }
};

// 5. Deletar paciente (as triagens dele também são removidas)
export const deletePatient = async (req, res) => {
  try {
    const patientId = Number(req.params.id);

    const patient = await patientModel.getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Paciente não encontrado." });
    }

    await patientModel.deletePatient(patientId);
    return res.status(200).json({ message: "Paciente removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao deletar paciente.", error: error.message });
  }
};
