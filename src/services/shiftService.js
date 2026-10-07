// Regras de negócio dos Plantões (choque de horários).
//
// Regras:
//   - o médico precisa existir e estar ativo
//   - o término deve ser depois do início
//   - o plantão não pode passar de MAX_SHIFT_HOURS (24h)
//   - CHOQUE: o médico não pode ter dois plantões que se sobreponham
//     (um plantão que termina às 19h e outro que começa às 19h NÃO colidem)

import { MAX_SHIFT_HOURS } from '../constants/hospital.js';

const erro = (message, status) => Object.assign(new Error(message), { status });

const MS_POR_HORA = 60 * 60 * 1000;

// Função pura: valida início e fim do plantão
export const validatePeriod = (start, end) => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw erro('Datas do plantão inválidas.', 422);
  }

  if (end <= start) {
    throw erro('O término do plantão deve ser posterior ao início.', 422);
  }

  if (end - start > MAX_SHIFT_HOURS * MS_POR_HORA) {
    throw erro(`O plantão não pode ter mais de ${MAX_SHIFT_HOURS} horas.`, 422);
  }
};

// Função pura: true se [start, end) colide com algum plantão da lista.
// "ignoreShiftId" serve para o plantão não colidir com ele mesmo ao ser editado.
export const hasOverlap = (start, end, shifts, ignoreShiftId = null) => {
  return shifts.some((shift) =>
    shift.id_shifts_pk !== ignoreShiftId &&
    start < new Date(shift.end_time) &&
    end > new Date(shift.start_time)
  );
};

export const createShiftService = ({ shiftModel, doctorModel }) => {

  const createShift = async ({ doctors_id_fk, start_time, end_time }) => {
    const doctor = await doctorModel.getDoctorById(doctors_id_fk);
    if (!doctor) {
      throw erro('Médico não encontrado.', 404);
    }
    if (!doctor.is_active) {
      throw erro('Médico inativo não pode receber plantão.', 422);
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    validatePeriod(start, end);

    const doctorShifts = await shiftModel.getShiftsByDoctor(doctors_id_fk);
    if (hasOverlap(start, end, doctorShifts)) {
      throw erro('Choque de plantão: o médico já possui plantão neste horário.', 409);
    }

    return await shiftModel.createShift({ doctors_id_fk, start_time: start, end_time: end });
  };

  const listShifts = async () => {
    return await shiftModel.getAllShifts();
  };

  const getShiftById = async (id) => {
    const shift = await shiftModel.getShiftById(id);
    if (!shift) {
      throw erro('Plantão não encontrado.', 404);
    }
    return shift;
  };

  const updateShift = async (id, data) => {
    const shift = await getShiftById(id); // lança 404 se não existir

    const start = new Date(data.start_time ?? shift.start_time);
    const end = new Date(data.end_time ?? shift.end_time);
    validatePeriod(start, end);

    const doctorShifts = await shiftModel.getShiftsByDoctor(shift.doctors_id_fk);
    if (hasOverlap(start, end, doctorShifts, id)) {
      throw erro('Choque de plantão: o médico já possui plantão neste horário.', 409);
    }

    return await shiftModel.updateShift(id, { start_time: start, end_time: end });
  };

  const removeShift = async (id) => {
    await getShiftById(id); // lança 404 se não existir
    await shiftModel.deleteShift(id);
  };

  return { createShift, listShifts, getShiftById, updateShift, removeShift };
};
