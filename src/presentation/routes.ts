import { Router } from 'express';
import { ChatbotService } from './chatbot/service';
import { envs } from '../config/envs';
import { ChatbotController } from './chatbot/controller';
import { ChatbotRoutes } from './chatbot/routes';
import rateLimiter from 'express-rate-limit';

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    const apiLimiter = rateLimiter({
      windowMs: 60 * 1000,
      max: 100,
      message: {
        msg: 'Máximo de peticiones alcanzado, reintentalo tras 1 minuto',
      },
    });

    router.use('/api/chat', apiLimiter, ChatbotRoutes.routes);

    return router;
  }
}
