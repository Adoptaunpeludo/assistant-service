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
import { ChatHistoryEntity } from '../../domain/entities/chat-history.entity';
import { BadRequestError, InternalServerError } from '../../domain/errors';
import { DynamicStructuredTool } from '@langchain/core/tools';

interface OpenAIOptions {
  openAIApiKey: string;
  temperature: number;
  maxTokens: number;
}

interface SupabaseOptions {
  supabaseUrl: string;
  supabaseKey: string;
}

interface ChatState {
  model: ChatOpenAI;
  client: SupabaseClient;
  agentExecutor: AgentExecutor;
  prompt: ChatPromptTemplate;
  retrieverTool: DynamicStructuredTool;
  memory: BufferMemory;
  tools: DynamicStructuredTool[];
}

export class ChatbotService {
  // private readonly model: ChatOpenAI;
  private readonly embeddings = new OpenAIEmbeddings();
  private chatStates: Map<string, ChatState> = new Map();

  /**
   * Creates an instance of ChatbotService.
   * @param openAIOptions Options for the OpenAI chat model.
   * @param supabaseOptions Options for connecting to Supabase.
   * @param memoryService Service for managing chat memory.
   * @param jwt Adapter for JWT token operations.
   */
  constructor(
    private readonly openAIOptions: OpenAIOptions,
    private readonly supabaseOptions: SupabaseOptions,
    private readonly memoryService: MemoryService
  ) {}

  private async getChatState(username: string): Promise<ChatState | undefined> {
    return this.chatStates.get(username);
  }

  private async updateChatState(
    username: string,
    chatState: ChatState
  ): Promise<void> {
    this.chatStates.set(username, chatState);
  }

  /**
   * Creates a new chat session.
   * @param token JWT token for authentication.
   */
  async createChat(username: string) {
    const { maxTokens, openAIApiKey, temperature } = this.openAIOptions;

    const model = new ChatOpenAI({
      openAIApiKey: openAIApiKey,
      temperature: temperature,
      maxTokens: maxTokens,
    });

    if (!model)
      throw new BadRequestError(
        'Error generando el modelo de IA, posiblemente API Key invalida'
      );

    const { supabaseKey, supabaseUrl } = this.supabaseOptions;
    const client = createClient(supabaseUrl, supabaseKey);

    if (!client)
      throw new BadRequestError(
        'Error creando cliente de Supabase, API Key o URL invalidas'
      );

    const prompt = this.createPrompt('adoptaunpeludo.com');

    const retrieverTool = await this.createRetrieverTool(client);

    if (!retrieverTool)
      throw new InternalServerError(
        'Error creating retriever tool, check server logs'
      );

    const memory = await this.memoryService.createMemory(username);

    if (!memory)
      throw new InternalServerError('Error creating memory, check server logs');

    const tools = [retrieverTool];

    const agentExecutor = await this.createAgentExecutor(
      tools,
      prompt,
      memory,
      model
    );

    if (!agentExecutor)
      throw new InternalServerError(
        'Error creating agent executor, check server logs'
      );

    this.updateChatState(username, {
      agentExecutor,
      memory,
      model,
      prompt,
      retrieverTool,
      client,
      tools,
    });
  }

  /**
   * Creates a prompt template for the chatbot based on the provided document.
   * @param document The document context for the chatbot.
   * @returns The generated chat prompt template.
   */
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

  /**
   * Creates a retriever tool for the chatbot.
   * @returns The retriever tool instance.
   * @throws Throws an error if there's an issue creating the retriever tool.
   */
  private async createRetrieverTool(client: SupabaseClient) {
    const vectorStore = await SupabaseVectorStore.fromExistingIndex(
      this.embeddings,
      {
        client: client,
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

  /**
   * Creates an agent executor for the chatbot.
   * @param tools Additional tools to be used by the agent.
   * @param prompt The prompt template for the agent.
   * @returns The agent executor instance.
   * @throws Throws an error if there's an issue creating the agent executor.
   */
  private async createAgentExecutor(
    tools: any,
    prompt: ChatPromptTemplate,
    memory: BufferMemory,
    model: ChatOpenAI
  ) {
    const agent = await createOpenAIFunctionsAgent({
      llm: model,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      memory,
    });

    return agentExecutor;
  }

  /**
   * Gets the chatbot's response to a given question.
   * @param question The question asked by the user.
   * @returns The chatbot's response.
   */

  public async getChatBotAnswer(question: string, username: string) {
    let chatState = await this.getChatState(username);

    if (!chatState) {
      await this.createChat(username);
      chatState = await this.getChatState(username);
    }

    const { agentExecutor, memory } = chatState!;

    const chat_history = await memory.chatHistory.getMessages();

    const response = await agentExecutor!.invoke({
      outputKey: 'output',
      input: question,
      chat_history,
    });

    return response.output;
  }

  /**
   * Retrieves the chat history.
   * @returns The chat history.
   */
  public async getChatHistory(username: string) {
    const memory = await this.memoryService.createMemory(username);
    const chat_history = await memory.chatHistory.getMessages();

    return ChatHistoryEntity.fromObject(chat_history);
  }

  /**
   * Deletes the chat history.
   */
  public async deleteChatHistory(username: string) {
    const memory = await this.memoryService.createMemory(username);
    await memory.chatHistory.clear();
  }
}
