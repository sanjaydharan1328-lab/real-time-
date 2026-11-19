import { Router } from "express";
import { getActivity } from "../controllers/monitorController.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();
router.get("/activity", authenticate, asyncHandler(getActivity));
export default router;
