import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './middlewares/error';
import { config } from './config';

export function createApp() {
  const app = express();

  // CORS allowlist
  const origins = config.corsOrigins.length ? config.corsOrigins : ['http://localhost:5173'];
  app.use(cors({
    origin: origins,
    credentials: true
  }));

  app.use(express.json());

  app.use('/api', routes);
  app.use(errorHandler);

  return app;
}
