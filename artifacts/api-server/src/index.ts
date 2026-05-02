import app from "./app.js";
import { logger } from "./lib/logger.js";
import { pool } from "@workspace/db";
import { submissionQueue } from "./lib/submission-worker.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port, workerConcurrency: 4 }, "Server listening — submission worker active");
});

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received — draining in-flight requests");

  server.close(async () => {
    logger.info("HTTP server closed — draining submission queue");

    try {
      await Promise.race([
        submissionQueue.drain(),
        new Promise<void>((resolve) => setTimeout(resolve, 15_000)),
      ]);
      logger.info("Submission queue drained");
    } catch (err) {
      logger.error({ err }, "Error draining queue");
    }

    try {
      await pool.end();
      logger.info("Database pool closed");
    } catch (err) {
      logger.error({ err }, "Error closing DB pool");
    }

    logger.info("Graceful shutdown complete");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after 30s timeout");
    process.exit(1);
  }, 30_000).unref();
}

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
});
