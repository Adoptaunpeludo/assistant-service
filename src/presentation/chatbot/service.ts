import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { createRetrieverTool } from 'langchain/tools/retriever';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { createOpenAIFunctionsAgent, AgentExecutor } from 'langchain/agents';
import { MemoryService } from '../memory/service';
import { BaseMessage } from '@langchain/core/messages';
import { ChatHistoryEntity } from '../../domain/entities/chat-history.entity';
import { JWTAdapter } from '../../config/jwt.adapter';
import {
  BadRequestError,
  InternalServerError,
  UnauthenticatedError,
} from '../../domain/errors';

interface OpenAIOptions {
  openAIApiKey: string;
  temperature: number;
  maxTokens: number;
}

interface SupabaseOptions {
  supabaseUrl: string;
  supabaseKey: string;
}

export class ChatbotService {
  private readonly model: ChatOpenAI;
  private readonly embeddings = new OpenAIEmbeddings();
  private readonly client: SupabaseClient;
  private agentExecutor?: AgentExecutor;
  private memory?: BufferMemory;
  private chat_history: BaseMessage[] = [];

  constructor(
    private readonly openAIOptions: OpenAIOptions,
    private readonly supabaseOptions: SupabaseOptions,
    private readonly memoryService: MemoryService,
    private readonly jwt: JWTAdapter
  ) {
    const { maxTokens, openAIApiKey, temperature } = this.openAIOptions;
    try {
      this.model = new ChatOpenAI({
        openAIApiKey: openAIApiKey,
        temperature: temperature,
        maxTokens: maxTokens,
      });

      if (!this.model)
        throw new BadRequestError('Error creating model, wrong openAIAPiKey');

      const { supabaseKey, supabaseUrl } = this.supabaseOptions;
      this.client = createClient(supabaseUrl, supabaseKey);

      if (!this.client)
        throw new BadRequestError(
          'Error creating supabase client, wrong Url or Key'
        );
    } catch (error) {
      console.log(error);
      throw new InternalServerError(
        'Error creating model or supabase client, check logs'
      );
    }
  }

  async createChat(token: string) {
    try {
      const payload = this.jwt.validateToken(token);

      if (!payload) throw new UnauthenticatedError('Invalid JWT token');

      const {
        user: { name: username },
      } = payload;

      const prompt = this.createPrompt('adoptaunpeludo.com');

      const retrieverTool = await this.createRetrieverTool();

      this.memory = await this.memoryService.createMemory(username!);

      const tools = [retrieverTool];

      this.agentExecutor = await this.createAgentExecutor(tools, prompt);
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error creating chat, check logs');
    }
  }

  private createPrompt(document: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an intelligent AI assistant designed to interpret and answer questions and instructions based on specific provided document: ${document}. The context from these documents has been processed and made accessible to you. 
        Your mission is to generate answers that are accurate, succinct, and comprehensive, drawing upon the information contained in the context of the documents. If the answer isn't readily found in the documents, don't try to make up de answer, kindly inform the user to contact support via email to support@adoptaunpeludo.com.
        You are also capable of evaluating, comparing and providing opinions based on the content of these documents. Hence, if asked to compare or analyze the documents, use your AI understanding to deliver an insightful response.
        If the query isn't related to the document context, kindly inform the user that your primary task is to answer questions specifically related to the document context.
        Always answer in the language you were initially asked.
        Provide your response in markdown format.`,
      ],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    return prompt;
  }

  private async createRetrieverTool() {
    try {
      const vectorStore = await SupabaseVectorStore.fromExistingIndex(
        this.embeddings,
        {
          client: this.client,
          tableName: 'documents',
          queryName: 'match_documents',
        }
      );

      const retriever = vectorStore.asRetriever();

      const retrieverTool = createRetrieverTool(retriever, {
        name: 'Adoptaunpeludo_Assistant',
        description: 'Toot to ask about the adoptaunpeludo.com webpage',
      });

      return retrieverTool;
    } catch (error) {
      console.log(error);
      throw new InternalServerError(
        'Error creating retriever tool, check logs'
      );
    }
  }

  private async createAgentExecutor(tools: any, prompt: ChatPromptTemplate) {
    try {
      const agent = await createOpenAIFunctionsAgent({
        llm: this.model,
        tools,
        prompt,
      });

      const agentExecutor = new AgentExecutor({
        agent,
        tools,
        memory: this.memory,
      });

      return agentExecutor;
    } catch (error) {
      console.log(error);
      throw new InternalServerError(
        'Error creating agent or agent executor, check logs'
      );
    }
  }

  public async getChatBotAnswer(question: string) {
    try {
      const response = await this.agentExecutor!.invoke({
        outputKey: 'output',
        input: question,
        chat_history: this.chat_history,
      });

      return response.output;
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error getting agent answer, check logs');
    }
  }

  public async getChatHistory() {
    try {
      this.chat_history = await this.memory!.chatHistory.getMessages();

      return ChatHistoryEntity.fromObject(this.chat_history);
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error loading chat history, check logs');
    }
  }

  public async deleteChatHistory() {
    try {
      await this.memory?.chatHistory.clear();
    } catch (error) {
      console.log(error);
      throw new InternalServerError('Error clearing chat history, check logs');
    }
  }
}
