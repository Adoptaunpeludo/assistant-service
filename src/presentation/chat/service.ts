import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
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

  private generateStandAloneQuestionChain() {
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

  private generateRetrieverChain() {
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

    const retriever = vectorStore.asRetriever();

    const retrieverChain = RunnableSequence.from([
      (prevResult) => prevResult.standaloneQuestion,
      retriever,
      this.combineDocuments,
    ]);

    return retrieverChain;
  }

  private combineDocuments(docs: Document[]) {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  }

  private generateAnswerChain() {
    const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about Adoptaunpeludo based on the context provided. Try to find the answer in the context. If you really don't know the answer, say "I'm sorry, I don't know the answer to that." And direct the questioner to email adoptaunpeludo@gmail.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
      context: {context}
      question: {question}
      answer:`;

    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);
    const answerChain = answerPrompt.pipe(this.model).pipe(this.stringParser);

    return answerChain;
  }

  public async getChatBotAnswer(question: string) {
    const standAloneQuestionChain = this.generateStandAloneQuestionChain();
    const retrieverChain = this.generateRetrieverChain();
    const answerChain = this.generateAnswerChain();

    const chain = RunnableSequence.from([
      {
        standaloneQuestion: standAloneQuestionChain,
        originalQuestion: this.passThrough,
      },
      {
        context: retrieverChain,
        question: ({ originalQuestion }) => originalQuestion.question,
      },
      answerChain,
    ]);

    const response = await chain.invoke({
      question,
    });

    return response;
  }
}
