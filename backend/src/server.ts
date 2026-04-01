import app from './app';
import prisma from './utils/prisma';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main() {
  // Verify DB connectivity before accepting traffic
  await prisma.$connect();
  console.log('[DB] Connected to PostgreSQL');

  const server = app.listen(PORT, () => {
    console.log(`[Server] AgriSmart API running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Server] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('[DB] Disconnected. Bye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
