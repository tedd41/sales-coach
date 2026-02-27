import { Router } from "express";
import * as intelligenceController from "../controllers/intelligenceController";

const router = Router();

router.post("/insights", intelligenceController.generateInsights);
router.post("/strategy", intelligenceController.generateStrategy);
router.post("/draft", intelligenceController.generateDraft);

export default router;
