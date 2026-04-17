import { Router } from "express";
import { OrdersController } from "../controllers/orders.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();

router.post("/", authMiddleware, OrdersController.create);
router.get("/", authMiddleware, OrdersController.myOrders);
router.get("/all", authMiddleware, adminMiddleware, OrdersController.allOrders);
router.put(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  OrdersController.updateStatus
);

export default router;
