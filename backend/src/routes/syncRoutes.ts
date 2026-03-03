import { Router, text } from "express";
import { manualIngest, powerAutomateWebhook, triggerDailyUpdate } from "../controllers/syncController";

const router = Router();

// Demo: paste email content directly into DB
router.post("/manual", manualIngest);

// Power Automate inbound webhook
// PA sends Content-Type: text/plain even though the body is HTML — apply
// text() middleware here only so global express.json() is not affected.
router.post("/webhook", text({ type: "text/plain" }), powerAutomateWebhook);

// Dev-only: manually fire the daily update cron job
// Blocked in production at the controller level — returns 404
router.post("/test-daily-update", triggerDailyUpdate);

export default router;
