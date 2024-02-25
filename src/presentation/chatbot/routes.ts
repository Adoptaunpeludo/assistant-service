import { Router } from 'express';
import { ChatbotService } from './service';
import { ChatbotController } from './controller';
import { envs } from '../../config/envs';

export class ChatbotRoutes {
  static get routes() {
    const router = Router();
    const chatbotService = new ChatbotService(envs.OPENAI_API_KEY, 0.7, 500);
    const chatbotController = new ChatbotController(chatbotService);

    router.post('/user-question', chatbotController.userQuestion);

    return router;
  }
}
