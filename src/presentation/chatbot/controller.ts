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
    const { username } = req.params;

    await this.chatbotService.createChat(username);
  };

  userQuestion = async (req: Request, res: Response) => {
    const { question, userId } = req.body;

    const response = await this.chatbotService.getChatBotAnswer(
      question,
      userId
    );

    return this.returnStream(res, response);
  };
}
