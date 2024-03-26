import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { createRetrieverTool } from 'langchain/tools/retriever';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  // PromptTemplate,
} from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { createOpenAIFunctionsAgent, AgentExecutor } from 'langchain/agents';

export class ChatbotService {
  private readonly model: ChatOpenAI;
  private readonly passThrough = new RunnablePassthrough();
  private readonly stringParser = new StringOutputParser();
  private readonly embeddings = new OpenAIEmbeddings();
  private readonly client: SupabaseClient;

  constructor(
    private readonly openAIApiKey: string,
    private readonly temperature: number,
    private readonly maxTokens: number,
    private readonly supabaseUrl: string,
    private readonly supabaseKey: string
  ) {
    this.model = new ChatOpenAI({
      openAIApiKey: this.openAIApiKey,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    });

    this.client = createClient(this.supabaseUrl, this.supabaseKey);
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
      name: 'Adoptaunpeludo Assistant',
      description: 'Toot to ask about the adoptaunpeludo.com webpage',
    });

    return retrieverTool;
  }

  private async createAgentExecutor(
    tools: any,
    prompt: ChatPromptTemplate
    // memory: BufferMemory,
  ) {
    const agent = await createOpenAIFunctionsAgent({
      llm: this.model,
      tools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools,
      // memory,
    });

    return agentExecutor;
  }

  public async getChatBotAnswer(question: string, convHistory: string[]) {
    const prompt = this.createPrompt('adoptaunpeludo.com');

    const retrieverTool = await this.createRetrieverTool();

    const tools = [retrieverTool];

    const agentExecutor = await this.createAgentExecutor(tools, prompt);
  }
}
