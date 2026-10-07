// Schemas para validar médicos. A regra do CRM (formato, UF) fica no service.
import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string({ message: "O nome é obrigatório." }).min(3, "O nome deve ter no mínimo 3 caracteres.").max(100),
  crm_number: z.string({ message: "O número do CRM é obrigatório." }).min(1, "O número do CRM é obrigatório."),
  crm_state: z.string({ message: "A UF do CRM é obrigatória." }).length(2, "A UF deve ter 2 letras."),
  specialty: z.string({ message: "A especialidade é obrigatória." }).min(2, "A especialidade é obrigatória.").max(100),
  is_active: z.boolean().optional()
});

export const updateDoctorSchema = createDoctorSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Envie ao menos um campo para atualizar." }
);

// Validação do ID via URL
export const idDoctorSchema = z.object({
  id: z.coerce.number().int().positive("O ID deve ser um número inteiro positivo")
});
