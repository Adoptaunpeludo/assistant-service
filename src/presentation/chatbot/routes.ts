import { Router } from 'express';
import { ChatbotService } from './service';
import { ChatbotController } from './controller';
import { envs } from '../../config/envs';
import { MemoryService } from '../services/memory.service';
import { JWTAdapter } from '../../config/jwt.adapter';
import { AuthMiddleware } from '../middlewares/auth-middleware';

export class ChatbotRoutes {
  static get routes() {
    const router = Router();
    const jwt = new JWTAdapter(envs.JWT_SEED);
    const authMiddleware = new AuthMiddleware(jwt);
    const memoryService = new MemoryService(envs.MONGO_DB_URL);
    const chatbotService = new ChatbotService(
      { maxTokens: 500, openAIApiKey: envs.OPENAI_API_KEY, temperature: 0.7 },
      {
        supabaseKey: envs.SUPABASE_PRIVATE_KEY,
        supabaseUrl: envs.SUPABASE_URL,
      },
      memoryService
    );
    const chatbotController = new ChatbotController(chatbotService);

    router.use(authMiddleware.authenticateUser);

    router.post('/create-chat/', chatbotController.createChat);
    router.delete('/chat-history/', chatbotController.deleteChatHistory);
    router.get('/chat-history', chatbotController.getChatHistory);
    router.post('/user-question', chatbotController.userQuestion);

    return router;
  }
}
