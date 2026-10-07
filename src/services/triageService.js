// Regras de negócio da Triagem e da fila de atendimento (Protocolo de Manchester + SLA).
//
// Classificação de prioridade (versão simplificada para fins acadêmicos), avaliada de cima para baixo:
//   VERMELHO (emergência, 0 min)     : inconsciente OU sangramento grave OU saturação < 90
//                                      OU batimentos < 40 OU batimentos > 150
//   LARANJA  (muito urgente, 10 min) : saturação < 94 OU temperatura >= 40 OU temperatura < 35
//                                      OU batimentos > 130 OU dor >= 8
//   AMARELO  (urgente, 60 min)       : temperatura >= 38.5 OU batimentos > 110 OU dor >= 5
//   VERDE    (pouco urgente, 120 min): temperatura >= 37.8 OU dor >= 3
//   AZUL     (não urgente, 240 min)  : demais casos
//
// Fila: ordenada por prioridade (vermelho primeiro) e, em empate, por quem chegou antes.
// SLA estourado: tempo de espera MAIOR que o limite da prioridade (igual ao limite ainda está no prazo).
//
// Chamar o próximo paciente: o médico precisa existir, estar ativo, estar em plantão AGORA
// e não pode ter outro atendimento em andamento.

import { PRIORITY, TRIAGE_STATUS } from '../constants/hospital.js';

const erro = (message, status) => Object.assign(new Error(message), { status });

const MS_POR_MINUTO = 60 * 1000;

// Função pura: recebe sinais vitais e devolve 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'BLUE'
export const classifyPriority = ({
  temperature,
  heart_rate,
  oxygen_saturation,
  pain_level,
  is_unconscious = false,
  has_severe_bleeding = false
}) => {
  if (
    is_unconscious ||
    has_severe_bleeding ||
    oxygen_saturation < 90 ||
    heart_rate < 40 ||
    heart_rate > 150
  ) {
    return PRIORITY.RED.name;
  }

  if (
    oxygen_saturation < 94 ||
    temperature >= 40 ||
    temperature < 35 ||
    heart_rate > 130 ||
    pain_level >= 8
  ) {
    return PRIORITY.ORANGE.name;
  }

  if (temperature >= 38.5 || heart_rate > 110 || pain_level >= 5) {
    return PRIORITY.YELLOW.name;
  }

  if (temperature >= 37.8 || pain_level >= 3) {
    return PRIORITY.GREEN.name;
  }

  return PRIORITY.BLUE.name;
};

export const createTriageService = ({
  triageModel,
  patientModel,
  doctorModel,
  shiftModel,
  clock = () => new Date() // injetável: nos testes dá para fixar a data/hora
}) => {

  const createTriage = async (data) => {
    const patient = await patientModel.getPatientById(data.patients_id_fk);
    if (!patient) {
      throw erro('Paciente não encontrado.', 404);
    }

    const openTriage = await triageModel.getOpenTriageByPatient(data.patients_id_fk);
    if (openTriage) {
      throw erro('Este paciente já possui uma triagem em aberto.', 409);
    }

    return await triageModel.createTriage({
      patients_id_fk: data.patients_id_fk,
      symptoms: data.symptoms,
      temperature: data.temperature,
      heart_rate: data.heart_rate,
      oxygen_saturation: data.oxygen_saturation,
      pain_level: data.pain_level,
      is_unconscious: data.is_unconscious ?? false,
      has_severe_bleeding: data.has_severe_bleeding ?? false,
      priority: classifyPriority(data),
      status: TRIAGE_STATUS.WAITING,
      arrived_at: clock()
    });
  };

  const listTriages = async () => {
    return await triageModel.getAllTriages();
  };

  const getTriageById = async (id) => {
    const triage = await triageModel.getTriageById(id);
    if (!triage) {
      throw erro('Triagem não encontrada.', 404);
    }
    return triage;
  };

  // Fila de espera ordenada, com tempo de espera e indicador de SLA estourado
  const getQueue = async () => {
    const waiting = await triageModel.getTriagesByStatus(TRIAGE_STATUS.WAITING);
    const now = clock();

    return waiting
      .map((triage) => {
        const sla = PRIORITY[triage.priority].slaMinutes;
        const waitedMs = now - new Date(triage.arrived_at);

        return {
          ...triage,
          sla_minutes: sla,
          minutes_waiting: Math.floor(waitedMs / MS_POR_MINUTO),
          is_sla_breached: waitedMs > sla * MS_POR_MINUTO
        };
      })
      .sort((a, b) =>
        PRIORITY[a.priority].rank - PRIORITY[b.priority].rank ||
        new Date(a.arrived_at) - new Date(b.arrived_at)
      );
  };

  // Médico chama o próximo paciente da fila
  const callNext = async (doctorId) => {
    const doctor = await doctorModel.getDoctorById(doctorId);
    if (!doctor) {
      throw erro('Médico não encontrado.', 404);
    }
    if (!doctor.is_active) {
      throw erro('Médico inativo não pode realizar atendimentos.', 422);
    }

    const now = clock();

    const activeShift = await shiftModel.getActiveShiftByDoctor(doctorId, now);
    if (!activeShift) {
      throw erro('Médico fora de plantão: não é possível chamar pacientes.', 422);
    }

    const inProgress = await triageModel.getInProgressTriageByDoctor(doctorId);
    if (inProgress) {
      throw erro('O médico já possui um atendimento em andamento.', 409);
    }

    const queue = await getQueue();
    if (queue.length === 0) {
      throw erro('Não há pacientes aguardando atendimento.', 404);
    }

    return await triageModel.updateTriage(queue[0].id_triages_pk, {
      status: TRIAGE_STATUS.IN_PROGRESS,
      doctors_id_fk: doctorId,
      called_at: now
    });
  };

  const finishTriage = async (id) => {
    const triage = await getTriageById(id); // lança 404 se não existir

    if (triage.status !== TRIAGE_STATUS.IN_PROGRESS) {
      throw erro('Apenas atendimentos em andamento podem ser finalizados.', 422);
    }

    return await triageModel.updateTriage(id, {
      status: TRIAGE_STATUS.FINISHED,
      finished_at: clock()
    });
  };

  return { createTriage, listTriages, getTriageById, getQueue, callNext, finishTriage };
};
