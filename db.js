// ESTE ARQUIVO É IMPORTANTE PARA CONEXÃO DO MYSQL COM O PRISMA ORM
// OBS: Não alterar este arquivo

import mariadb from 'mariadb'; 
import { PrismaMariaDb } from '@prisma/adapter-mariadb'; 
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import dotenv from 'dotenv';

dotenv.config();


const pool = mariadb.createPool({

  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'seu_banco_de_dados',
  port: Number(process.env.DB_PORT) || 3306,
  

  rowsAsArray: false // Garante que o Prisma receba objetos do banco
});

const adapter = new PrismaMariaDb(pool); 
const prisma = new PrismaClient({ adapter });


export default prisma;
