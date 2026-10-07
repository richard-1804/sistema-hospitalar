// Schemas para validar pacientes.
import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string({ message: "O nome é obrigatório." }).min(3, "O nome deve ter no mínimo 3 caracteres.").max(100),
  cpf: z.string({ message: "O CPF é obrigatório." }).regex(/^\d{11}$/, "O CPF deve ter 11 dígitos numéricos."),
  birth_date: z.coerce.date({ message: "Data de nascimento inválida." })
});

export const updatePatientSchema = createPatientSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Envie ao menos um campo para atualizar." }
);

export const idPatientSchema = z.object({
  id: z.coerce.number().int().positive("O ID deve ser um número inteiro positivo")
});
