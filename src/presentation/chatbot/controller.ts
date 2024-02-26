import { Request, Response } from 'express';
import { ChatbotService } from './service';

export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly convHistory: string[] = []
  ) {}

  userQuestion = async (req: Request, res: Response) => {
    const { question } = req.body;

    const response = await this.chatbotService.getChatBotAnswer(
      question,
      this.convHistory
    );

    res.setHeader('Content-Type', 'application/json');
    res.status(200);

    let answer = '';
    for await (const chunk of response) {
      answer += chunk;
      console.log({ chunk });
      res.write(chunk);
    }
    this.convHistory.push(answer);

    res.end();
  };
}
