import { Router } from 'express';
import { getReviews, createReview, deleteReview } from '../controllers/reviews.controller.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.get('/', getReviews);
router.post('/', authenticate, createReview);
router.delete('/:id', authenticate, deleteReview);

export default router;
