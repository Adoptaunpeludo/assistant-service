import { Router } from 'express';
import { ChatbotService } from './chatbot/service';
import { envs } from '../config/envs';
import { ChatbotController } from './chatbot/controller';
import { ChatbotRoutes } from './chatbot/routes';

export class AppRoutes {
  static get routes(): Router {
    const router = Router();

    router.use('/api/chat', ChatbotRoutes.routes);

    return router;
  }
}
