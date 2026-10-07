// Schemas para validar triagens. A prioridade NÃO é enviada: o service calcula pelos sinais vitais.
import { z } from 'zod';

export const createTriageSchema = z.object({
  patients_id_fk: z.number({ message: "O ID do paciente é obrigatório." }).int().positive("ID do paciente inválido."),
  symptoms: z.string({ message: "Os sintomas são obrigatórios." }).min(3, "Descreva os sintomas."),
  temperature: z.number({ message: "A temperatura é obrigatória." }).min(30, "Temperatura inválida.").max(45, "Temperatura inválida."),
  heart_rate: z.number({ message: "Os batimentos são obrigatórios." }).int().min(0, "Batimentos inválidos.").max(300, "Batimentos inválidos."),
  oxygen_saturation: z.number({ message: "A saturação é obrigatória." }).int().min(0, "Saturação inválida.").max(100, "Saturação inválida."),
  pain_level: z.number({ message: "O nível de dor é obrigatório." }).int().min(0, "A dor vai de 0 a 10.").max(10, "A dor vai de 0 a 10."),
  is_unconscious: z.boolean().optional(),
  has_severe_bleeding: z.boolean().optional()
});

// PATCH /triages/call-next
export const callNextSchema = z.object({
  doctors_id_fk: z.number({ message: "O ID do médico é obrigatório." }).int().positive("ID do médico inválido.")
});

export const idTriageSchema = z.object({
  id: z.coerce.number().int().positive("O ID deve ser um número inteiro positivo")
});
