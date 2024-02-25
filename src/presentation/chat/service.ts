import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { RunnablePassthrough } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PrismaVectorStore } from '@langchain/community/vectorstores/prisma';
import { Document } from 'langchain/document';
import { prisma } from '../../data/prisma';
import { Prisma } from '@prisma/client';

export class ChatService {
  private readonly model: ChatOpenAI;
  private readonly passThrough = new RunnablePassthrough();
  private readonly stringParser = new StringOutputParser();
  private readonly embeddings = new OpenAIEmbeddings();

  constructor(
    private readonly openAIApiKey: string,
    private readonly temperature: number,
    private readonly maxTokens: number
  ) {
    this.model = new ChatOpenAI({
      openAIApiKey: this.openAIApiKey,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    });
  }

  private generateStandAloneQuestion() {
    const standAloneQuestionTemplate = `Given a question, convert it to a standalone question.
    question: {question}
    standalone question:`;

    const standAloneQuestionPrompt = PromptTemplate.fromTemplate(
      standAloneQuestionTemplate
    );

    const standAloneQuestionChain = standAloneQuestionPrompt
      .pipe(this.model)
      .pipe(this.stringParser);

    return standAloneQuestionChain;
  }

  private retriever() {
    const vectorStore = new PrismaVectorStore(this.embeddings, {
      db: prisma,
      prisma: Prisma,
      tableName: 'Documents',
      vectorColumnName: 'vector',
      columns: {
        id: PrismaVectorStore.IdColumn,
        content: PrismaVectorStore.ContentColumn,
      },
    });

    return vectorStore.asRetriever();
  }

  private combineDocuments(docs: Document[]) {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  }
}
