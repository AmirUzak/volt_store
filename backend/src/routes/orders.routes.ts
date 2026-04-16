import { Router } from 'express';
import {
  getUserOrders,
  getOrderById,
  checkout,
  updateStatus,
} from '../controllers/orders.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorizeAdmin.js';

const router = Router();

router.get('/', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/checkout', authenticate, checkout);
router.put('/:id/status', authenticate, authorizeAdmin, updateStatus);

export default router;
