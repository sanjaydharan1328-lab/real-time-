import { Router } from "express";
import { transitionDemo } from "../controllers/automataController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
router.post("/transition", authenticate, transitionDemo);
export default router;
