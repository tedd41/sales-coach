import pino from "pino";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
    // Redact sensitive fields if they ever appear in log meta
    redact: ["meta.apiKey", "meta.password", "meta.token"],
  },
  isDev
    ? pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        },
      })
    : pino.destination(1), // stdout JSON for production log aggregators
);

type LogMeta = Record<string, unknown>;

/**
 * Persists errors/warns to AppLog table in DB.
 * Fire-and-forget — never blocks or crashes the request.
 */
function persistToDb(
  level: "error" | "warn",
  context: string,
  message: string,
  error?: unknown,
  meta?: LogMeta,
) {
  const stack =
    error instanceof Error ? error.stack : error ? String(error) : undefined;

  prisma.appLog
    .create({
      data: {
        level,
        context,
        message,
        stack,
        meta: meta ? JSON.stringify(meta) : null,
      },
    })
    .catch((dbErr: unknown) => {
      logger.warn({ err: dbErr }, "[logService] Failed to persist log to DB");
    });
}

export const log = {
  error(context: string, message: string, error?: unknown, meta?: LogMeta) {
    logger.error(
      {
        context,
        err: error instanceof Error ? error : { raw: error },
        ...meta,
      },
      message,
    );
    persistToDb("error", context, message, error, meta);
  },

  warn(context: string, message: string, meta?: LogMeta) {
    logger.warn({ context, ...meta }, message);
    persistToDb("warn", context, message, undefined, meta);
  },

  info(context: string, message: string, meta?: LogMeta) {
    // info stays stdout only — AppLog is for actionable issues
    logger.info({ context, ...meta }, message);
  },

  debug(context: string, message: string, meta?: LogMeta) {
    logger.debug({ context, ...meta }, message);
  },
};
