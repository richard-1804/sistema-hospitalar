// Lógica de banco de dados para Usuários (buscar por e-mail para login, criar novo usuário).

import prisma from '../../db.js';

export const findUserByEmail = async (email) => {
  return await prisma.users.findUnique({
    where: { email }
  });
};

export const createUser = async (userData) => {
  return await prisma.users.create({
    data: userData,
    select: {
      id_users_pk: true,
      name: true,
      email: true,
      created_at: true
    }
  });
};
