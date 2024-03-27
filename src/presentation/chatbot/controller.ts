import { Request, Response } from 'express';
import { ChatbotService } from './service';
import { Readable } from 'stream';

export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  private async returnStream(res: Response, response: string) {
    function* chunkText(text: string, chunkSize: number) {
      for (let i = 0; i < text.length; i += chunkSize) {
        yield text.slice(i, i + chunkSize);
      }
    }

    const chunkSize = 10;
    const chunkGenerator = chunkText(response, chunkSize);

    const readable = Readable.from(chunkGenerator);

    res.setHeader('Content-Type', 'application/json');
    res.status(200);

    for await (const chunk of readable) {
      res.write(chunk);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    res.end();
  }

  createChat = async (req: Request, res: Response) => {
    const { token } = req.params;

    await this.chatbotService.createChat(token);
    res.status(200).json({ message: 'Chat created successfully' });
  };

  userQuestion = async (req: Request, res: Response) => {
    const { question } = req.body;

    const response = await this.chatbotService.getChatBotAnswer(question);
    return this.returnStream(res, response);
  };

  getChatHistory = async (_req: Request, res: Response) => {
    const history = await this.chatbotService.getChatHistory();
    res.status(200).json(history);
  };

  deleteChatHistory = async (_req: Request, res: Response) => {
    await this.chatbotService.deleteChatHistory();
    res.status(200).json({ message: 'Chat history deleted successfully' });
  };
}
