import { Router } from 'express';
import { ChatbotService } from './service';
import { ChatbotController } from './controller';
import { envs } from '../../config/envs';
import { MemoryService } from '../memory/service';

export class ChatbotRoutes {
  static get routes() {
    const router = Router();
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

    router.delete('/chat-history/', chatbotController.deleteChatHistory);
    router.post('/create-chat/:username', chatbotController.createChat);
    router.post('/user-question', chatbotController.userQuestion);

    return router;
  }
}
