import { Router } from "express";
import * as controller from "../controllers/documentController.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.listDocuments));
router.post("/", asyncHandler(controller.createDocument));
router.get("/:id/history", asyncHandler(controller.getHistory));
router.post("/:id/share", asyncHandler(controller.shareDocument));
router.patch("/:id/lock", asyncHandler(controller.changeLock));
router.get("/:id", asyncHandler(controller.getDocument));
router.put("/:id", asyncHandler(controller.updateDocument));
router.delete("/:id", asyncHandler(controller.deleteDocument));
export default router;
