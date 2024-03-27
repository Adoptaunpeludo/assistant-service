import { BufferMemory } from 'langchain/memory';
import { Collection, MongoClient } from 'mongodb';
import { MongoDBChatMessageHistory } from '@langchain/mongodb';
import { InternalServerError, NotFoundError } from '../../domain/errors';

export class MemoryService {
  constructor(private readonly mongoDBUrl: string) {}

  private async connectToCollection(): Promise<Collection> {
    try {
      const client: MongoClient = new MongoClient(this.mongoDBUrl);
      await client.connect();
      console.log('Connected to collection');
      return client.db('memory').collection('history');
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error connecting to memory collection');
    }
  }

  async getCollection(): Promise<Collection> {
    return await this.connectToCollection();
  }

  async createMemory(username: string) {
    const collection = await this.getCollection();

    try {
      const memory = new BufferMemory({
        returnMessages: true,
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'output',
        chatHistory: new MongoDBChatMessageHistory({
          collection,
          sessionId: username,
        }),
      });

      return memory;
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error creating memory');
    }
  }

  async removeHistory(userId: string) {
    try {
      const memory = await this.createMemory(userId);

      if (!memory)
        throw new NotFoundError(`History for ${userId} does not exist`);

      await memory.chatHistory.clear();
    } catch (error) {
      console.log(error);
      throw new InternalServerError(`Error deleting history for ${userId}`);
    }
  }
}
