import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./lib/logger.js";
import prisma from "./lib/db.js";

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

async function shutdown() {
  logger.info("Shutting down...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
