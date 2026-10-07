// Schemas para validar plantões. As regras de choque de horário ficam no service.
import { z } from 'zod';

export const createShiftSchema = z.object({
  doctors_id_fk: z.number({ message: "O ID do médico é obrigatório." }).int().positive("ID do médico inválido."),
  start_time: z.coerce.date({ message: "Início do plantão inválido." }),
  end_time: z.coerce.date({ message: "Término do plantão inválido." })
});

export const updateShiftSchema = z.object({
  start_time: z.coerce.date({ message: "Início do plantão inválido." }).optional(),
  end_time: z.coerce.date({ message: "Término do plantão inválido." }).optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "Envie ao menos um campo para atualizar." }
);

export const idShiftSchema = z.object({
  id: z.coerce.number().int().positive("O ID deve ser um número inteiro positivo")
});
