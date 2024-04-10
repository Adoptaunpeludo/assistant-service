import { Request, Response } from 'express';
import { ChatbotService } from './service';
import { Readable } from 'stream';

export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Returns a stream of chunks to the response.
   * @param res The response object.
   * @param response The response string to be chunked.
   */
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

  /**
   * Endpoint to create a new chat session.
   * @param req The request object.
   * @param res The response object.
   */
  createChat = async (req: Request, res: Response) => {
    const id = req.user.id;

    await this.chatbotService.createChat(id!);
    res.status(200).json({ message: 'Chat created successfully' });
  };

  /**
   * Endpoint to handle user questions and return chatbot responses as a stream.
   * @param req The request object.
   * @param res The response object.
   */
  userQuestion = async (req: Request, res: Response) => {
    const { question } = req.body;

    const response = await this.chatbotService.getChatBotAnswer(
      question,
      req.user.id!
    );
    return this.returnStream(res, response);
  };

  /**
   * Endpoint to retrieve chat history.
   * @param _req The request object.
   * @param res The response object.
   */
  getChatHistory = async (req: Request, res: Response) => {
    const id = req.user.id;

    const history = await this.chatbotService.getChatHistory(id!);
    res.status(200).json(history);
  };

  /**
   * Endpoint to delete chat history.
   * @param _req The request object.
   * @param res The response object.
   */
  deleteChatHistory = async (req: Request, res: Response) => {
    const id = req.user.id;

    await this.chatbotService.deleteChatHistory(id!);
    res.status(200).json({ message: 'Chat history deleted successfully' });
  };
}
