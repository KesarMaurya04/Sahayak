import { createApp } from './app';
import { connectDB } from './db';
import { config } from './config';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});