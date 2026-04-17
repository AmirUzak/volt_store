import { Router } from "express";
import multer from "multer";
import { ProductsController } from "../controllers/products.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { adminMiddleware } from "../middleware/admin.middleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", ProductsController.getAll);
router.get("/:id", ProductsController.getById);
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  ProductsController.create
);
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  ProductsController.update
);
router.delete("/:id", authMiddleware, adminMiddleware, ProductsController.remove);

export default router;
