import express from 'express';
import * as shiftController from '../controllers/shiftController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate, validateParams } from '../middleware/validateMiddleware.js';
import { createShiftSchema, updateShiftSchema, idShiftSchema } from '../schemas/shiftSchema.js';

const router = express.Router();

// Todas as rotas de plantões exigem token JWT
router.use(authMiddleware);

router.get('/', shiftController.getShifts);
router.get('/:id', validateParams(idShiftSchema), shiftController.getShiftById);
router.post('/', validate(createShiftSchema), shiftController.createShift);
router.put('/:id', validateParams(idShiftSchema), validate(updateShiftSchema), shiftController.updateShift);
router.delete('/:id', validateParams(idShiftSchema), shiftController.deleteShift);

export default router;
