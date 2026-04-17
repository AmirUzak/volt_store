import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", CartController.getCart);
router.post("/", CartController.addToCart);
router.put("/:productId", CartController.updateQuantity);
router.delete("/:productId", CartController.removeFromCart);
router.delete("/", CartController.clearCart);

export default router;
