import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getOrders, acceptOrder, rejectOrder, payOrder, closeSession,
  getTables, createTable, patchTable, getTableQR,
  getCategories, createCategory, patchCategory, deleteCategory,
  getMenuItems, createMenuItem, patchMenuItem, deleteMenuItem,
  getSettings, patchSettings,
  getAnalytics, exportAnalytics
} from '../controllers/adminController.js';

const router = Router();

router.use(authMiddleware);

router.get('/orders', getOrders);
router.patch('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/reject', rejectOrder);
router.patch('/orders/:id/paid', payOrder);
router.patch('/sessions/:id/close', closeSession);

router.get('/tables', getTables);
router.post('/tables', createTable);
router.patch('/tables/:id', patchTable);
router.get('/tables/:id/qr', getTableQR);

router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', patchCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/menu-items', getMenuItems);
router.post('/menu-items', createMenuItem);
router.patch('/menu-items/:id', patchMenuItem);
router.delete('/menu-items/:id', deleteMenuItem);

router.get('/settings', getSettings);
router.patch('/settings', patchSettings);

router.get('/analytics', getAnalytics);
router.get('/analytics/export', exportAnalytics);

export default router;
