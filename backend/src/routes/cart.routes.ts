import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', authenticate, getCart);
router.post('/add', authenticate, addItem);
router.put('/item/:id', authenticate, updateItem);
router.delete('/item/:id', authenticate, removeItem);
router.delete('/clear', authenticate, clearCart);

export default router;
