import { Router } from 'express';
import { login, logout, me, createAdmin } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.post('/create-admin', authMiddleware, createAdmin);

export default router;
