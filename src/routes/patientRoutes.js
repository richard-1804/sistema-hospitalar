import express from 'express';
import * as patientController from '../controllers/patientController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate, validateParams } from '../middleware/validateMiddleware.js';
import { createPatientSchema, updatePatientSchema, idPatientSchema } from '../schemas/patientSchema.js';

const router = express.Router();

// Todas as rotas de pacientes exigem token JWT
router.use(authMiddleware);

router.get('/', patientController.getPatients);
router.get('/:id', validateParams(idPatientSchema), patientController.getPatientById);
router.post('/', validate(createPatientSchema), patientController.createPatient);
router.put('/:id', validateParams(idPatientSchema), validate(updatePatientSchema), patientController.updatePatient);
router.delete('/:id', validateParams(idPatientSchema), patientController.deletePatient);

export default router;
