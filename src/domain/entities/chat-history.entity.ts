import { BaseMessage } from '@langchain/core/messages';

interface History {
  type: 'HumanMessage' | 'AIMessage';
  message: string;
}

export class ChatHistoryEntity {
  static fromObject(history: any) {
    const chatHistory: History[] = history.map((item: any) => {
      // Determinar el tipo de mensaje
      const messageType =
        item.constructor.name === 'HumanMessage' ? 'HumanMessage' : 'AIMessage';

      // Obtener el contenido del mensaje
      const messageContent = item.content;

      // Crear objeto de historial con el tipo y el mensaje
      const messageEntry: History = {
        type: messageType,
        message: messageContent,
      };

      return messageEntry;
    });

    return chatHistory;
  }
}
