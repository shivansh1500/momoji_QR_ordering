import { Router } from 'express';
import { getMenu, createOrder, getSession } from '../controllers/customerController.js';

const router = Router();

router.get('/menu', getMenu);
router.post('/orders', createOrder);
router.get('/session/:sessionId', getSession);

export default router;
