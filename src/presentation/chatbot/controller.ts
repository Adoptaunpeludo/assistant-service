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

    try {
      const history = await this.chatbotService.createChat(username);
      res.status(200).json({ message: 'Chat created successfully', history });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  };

  userQuestion = async (req: Request, res: Response) => {
    const { question } = req.body;

    try {
      const response = await this.chatbotService.getChatBotAnswer(question);
      return this.returnStream(res, response);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error });
    }
  };
}
