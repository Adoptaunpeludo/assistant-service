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
    private readonly memoryService: MemoryService
  ) {
    const { maxTokens, openAIApiKey, temperature } = this.openAIOptions;

    this.model = new ChatOpenAI({
      openAIApiKey: openAIApiKey,
      temperature: temperature,
      maxTokens: maxTokens,
    });

    const { supabaseKey, supabaseUrl } = this.supabaseOptions;
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async createChat(username: string) {
    try {
      const prompt = this.createPrompt('adoptaunpeludo.com');

      const retrieverTool = await this.createRetrieverTool();

      this.memory = await this.memoryService.createMemory(username);

      const tools = [retrieverTool];

      this.agentExecutor = await this.createAgentExecutor(tools, prompt);

      this.chat_history = await this.memory.chatHistory.getMessages();

      return ChatHistoryEntity.fromObject(this.chat_history);
    } catch (error) {
      console.log(error);

      throw 'Error creating chat agent';
    }
  }

  private createPrompt(document: string) {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an intelligent AI assistant designed to interpret and answer questions and instructions based on specific provided document: ${document}. The context from these documents has been processed and made accessible to you. 
        Your mission is to generate answers that are accurate, succinct, and comprehensive, drawing upon the information contained in the context of the documents. If the answer isn't readily found in the documents, you should make use of your training data and understood context to infer and provide the most plausible response.
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
  }

  private async createAgentExecutor(tools: any, prompt: ChatPromptTemplate) {
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
  }

  public async getChatBotAnswer(question: string) {
    const response = await this.agentExecutor!.invoke({
      outputKey: 'output',
      input: question,
      chat_history: this.chat_history,
    });

    return response.output;
  }

  public async deleteChatHistory() {
    await this.memory?.chatHistory.clear();
  }
}
