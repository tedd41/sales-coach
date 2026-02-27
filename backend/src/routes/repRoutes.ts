import { Router } from "express";
import * as repController from "../controllers/repController";

const router = Router();

router.get("/", repController.getAllReps);
router.get("/by-email/:email", repController.getRepByEmail);
router.get("/:id", repController.getRepById);
router.get("/:id/updates", repController.getRepUpdates);
router.get("/:id/feedback", repController.getRepFeedback);
router.post("/feedback", repController.createFeedback);

export default router;
