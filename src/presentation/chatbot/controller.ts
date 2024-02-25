import { Request, Response } from 'express';
import { ChatbotService } from './service';

export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  userQuestion = async (req: Request, res: Response) => {
    const { question } = req.body;

    const answer = await this.chatbotService.getChatBotAnswer(question);

    res.status(200).send({ answer });
  };
}
