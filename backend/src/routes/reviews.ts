import { Router } from "express";
import { ReviewsController } from "../controllers/reviews.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/product/:productId", ReviewsController.getByProduct);
router.get("/my", authMiddleware, ReviewsController.getMine);
router.post("/", authMiddleware, ReviewsController.upsert);
router.delete("/:id", authMiddleware, ReviewsController.remove);

export default router;
