import express from 'express';
import * as triageController from '../controllers/triageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate, validateParams } from '../middleware/validateMiddleware.js';
import { createTriageSchema, callNextSchema, idTriageSchema } from '../schemas/triageSchema.js';

const router = express.Router();

// Todas as rotas de triagem exigem token JWT
router.use(authMiddleware);

router.post('/', validate(createTriageSchema), triageController.createTriage);
router.get('/', triageController.getTriages);

// Rotas fixas (/queue e /call-next) precisam vir ANTES de /:id
router.get('/queue', triageController.getQueue);
router.patch('/call-next', validate(callNextSchema), triageController.callNext);

router.get('/:id', validateParams(idTriageSchema), triageController.getTriageById);
router.patch('/:id/finish', validateParams(idTriageSchema), triageController.finishTriage);

export default router;
