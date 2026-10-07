// Aqui fazemos a comunicação com o servidor nodemon
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Importação das Rotas
import authRoutes from './src/routes/authRoutes.js';
import doctorRoutes from './src/routes/doctorRoutes.js';
import patientRoutes from './src/routes/patientRoutes.js';
import shiftRoutes from './src/routes/shiftRoutes.js';
import triageRoutes from './src/routes/triageRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares Globais
app.use(cors());
app.use(express.json());

// Verificação do funcionamento da API
app.get('/', (req, res) => {
  return res.status(200).json({ message: "API Hospital & Triagem rodando com sucesso" });
});

// Utilização das Rotas
app.use('/auth', authRoutes);
app.use('/doctors', doctorRoutes);
app.use('/patients', patientRoutes);
app.use('/shifts', shiftRoutes);
app.use('/triages', triageRoutes);

// Servidor Iniciado
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}/`);
});
