import express from 'express';
import * as doctorController from '../controllers/doctorController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate, validateParams } from '../middleware/validateMiddleware.js';
import { createDoctorSchema, updateDoctorSchema, idDoctorSchema } from '../schemas/doctorSchema.js';

const router = express.Router();

// Todas as rotas de médicos exigem token JWT
router.use(authMiddleware);

router.get('/', doctorController.getDoctors);
router.get('/:id', validateParams(idDoctorSchema), doctorController.getDoctorById);
router.post('/', validate(createDoctorSchema), doctorController.createDoctor);
router.put('/:id', validateParams(idDoctorSchema), validate(updateDoctorSchema), doctorController.updateDoctor);
router.delete('/:id', validateParams(idDoctorSchema), doctorController.deleteDoctor);

export default router;
