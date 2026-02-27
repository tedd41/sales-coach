import { Router } from "express";
import { manualIngest, mailgunInbound } from "../controllers/syncController";

const router = Router();

// Demo: paste email content directly into DB
router.post("/manual", manualIngest);

// Mailgun inbound webhook (tomorrow — see MAILGUN_TODO.md)
router.post("/webhook", mailgunInbound);

export default router;
