import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { sendEmail, buildDailyUpdateEmail } from "./emailService";
import { log } from "./logService";

// TODO: If the app ever runs multi-instance (horizontal scaling / PM2 cluster),
//       move cron scheduling to a dedicated worker process to avoid duplicate
//       sends. For a single-instance deployment this is fine.

const prisma = new PrismaClient();

export async function sendDailyUpdateEmails(): Promise<void> {
  log.info("cronService", "Daily update job fired — fetching reps");

  const reps = await prisma.salesRep.findMany({
    where: { email: { not: null } },
    select: { id: true, name: true, email: true },
  });

  if (reps.length === 0) {
    log.info("cronService", "No reps with email addresses found — nothing to send");
    return;
  }

  let sent = 0;
  let skipped = 0;

  for (const rep of reps) {
    if (!rep.email) {
      skipped++;
      continue;
    }

    try {
      const payload = buildDailyUpdateEmail({ name: rep.name, email: rep.email });
      await sendEmail(payload);
      sent++;
    } catch (error) {
      log.error(
        "cronService.sendDailyUpdateEmails",
        `Failed to send daily update to rep ${rep.id}`,
        error,
        { repId: rep.id, repEmail: rep.email },
      );
    }
  }

  log.info("cronService", `Daily update job complete`, { sent, skipped });
}

export function startCron(): void {
  // Default: 10am Mon–Fri. Override via DAILY_UPDATE_CRON env var.
  const schedule = process.env.DAILY_UPDATE_CRON || "0 10 * * 1-5";

  if (!cron.validate(schedule)) {
    log.warn(
      "cronService",
      `Invalid DAILY_UPDATE_CRON expression "${schedule}" — cron not started`,
    );
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      await sendDailyUpdateEmails();
    } catch (error) {
      log.error(
        "cronService",
        "Unhandled error in daily update cron job",
        error,
      );
    }
  });

  log.info("cronService", `Daily update cron scheduled: "${schedule}"`);
}
