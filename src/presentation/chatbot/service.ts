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

export class ChatbotService {
  private readonly model: ChatOpenAI;
  private readonly passThrough = new RunnablePassthrough();
  private readonly stringParser = new StringOutputParser();
  private readonly embeddings = new OpenAIEmbeddings();
  private readonly convHistory: string[] = [];

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
    const standAloneQuestionTemplate = `Given some conversation history (if any) and a question, convert the question to a standalone question.
    conversation history: {conv_history}
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
      (prevResult) => prevResult.standalone_question,
      retriever,
      this.combineDocuments,
    ]);

    return retrieverChain;
  }

  private combineDocuments(docs: Document[]) {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  }

  private generateAnswerChain() {
    const answerTemplate = `You are a helpful and enthusiastic support bot who can answer a given question about adoptaunpeludo.com based on the context provided and the conversation history. Try to find the answer in the context. If the answer is not given in the context, find the answer in the conversation history if possible. If you really don't know the answer, say "Lo siento, no puedo responderte a eso." And direct the questioner to email adoptaunpeludoapp@gmail.com. Don't try to make up an answer. Always speak as if you were chatting to a friend.
    context: {context}
    conversation history: {conv_history}
    question: {question}
    answer: `;

    const answerPrompt = PromptTemplate.fromTemplate(answerTemplate);
    const answerChain = answerPrompt.pipe(this.model).pipe(this.stringParser);

    return answerChain;
  }

  private formatConvHistory(messages: string[]) {
    return messages
      .map((message, i) => {
        if (i % 2 === 0) {
          return `Human: ${message}`;
        } else {
          return `AI: ${message}`;
        }
      })
      .join('\n');
  }

  public async getChatBotAnswer(question: string, convHistory: string[]) {
    const standAloneQuestionChain = this.generateStandAloneQuestionChain();
    const retrieverChain = this.generateRetrieverChain();
    const answerChain = this.generateAnswerChain();

    const chain = RunnableSequence.from([
      {
        standalone_question: standAloneQuestionChain,
        originalInput: this.passThrough,
      },
      {
        context: retrieverChain,
        question: ({ originalInput }) => originalInput.question,
        conv_history: ({ originalInput }) => {
          console.log({ history: originalInput.conv_history });
          return originalInput.conv_history;
        },
      },
      answerChain,
    ]);

    const stream = await chain.stream({
      question,
      conv_history: this.formatConvHistory(convHistory),
    });

    convHistory.push(question);

    return stream;
  }
}
