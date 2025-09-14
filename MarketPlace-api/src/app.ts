import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';                
import { randomUUID } from 'crypto';              
import routes from './routes';
import { errorHandler } from './middlewares/error';
import { config } from './config';
import { logger } from './utils/logger';          
import { rateLimitGlobal } from './middlewares/rateLimit';

export function createApp() {
  const app = express();

  const origins = config.corsOrigins.length ? config.corsOrigins : ['http://localhost:5173'];
  app.use(cors({ origin: origins, credentials: true }));

  app.use(pinoHttp({
    logger,
    genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID()
  }));
  app.use((req, res, next) => {                   // echo request id back to client
    const id = (req as any).id;
    if (id) res.setHeader('X-Request-Id', id);
    next();
  });

  app.use(cookieParser());
  app.use(express.json());

  app.use('/api', routes);
  app.use(errorHandler);
  app.use(rateLimitGlobal());

  return app;
}