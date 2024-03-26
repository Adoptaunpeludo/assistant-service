import { BufferMemory } from 'langchain/memory';
import { Collection, MongoClient } from 'mongodb';
import { MongoDBChatMessageHistory } from '@langchain/mongodb';

export class MemoryService {
  constructor(private readonly mongoDBUrl: string) {}

  private async connectToCollection(): Promise<Collection> {
    try {
      const client: MongoClient = new MongoClient(this.mongoDBUrl);
      await client.connect();
      return client.db('memory').collection('history');
    } catch (error) {
      console.log(error);
      throw 'Error connecting to MongoDB';
    }
  }

  async getCollection(): Promise<Collection> {
    return await this.connectToCollection();
  }

  async createMemory(userId: string) {
    const collection = await this.getCollection();

    const memory = new BufferMemory({
      chatHistory: new MongoDBChatMessageHistory({
        collection,
        sessionId: userId,
      }),
    });

    return memory;
  }

  async removeHistory(userId: string) {
    try {
      const memory = await this.createMemory(userId);
      await memory.chatHistory.clear();
    } catch (error) {
      console.log(error);
      throw 'Could not remove chat history';
    }
  }
}
