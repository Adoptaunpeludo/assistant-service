import { Channel } from 'amqplib';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';

/**
 * ProducerService class for sending messages to RabbitMQ queues.
 */
export class QueueService {
  private channelWrapper: ChannelWrapper;

  /**
   * Constructs an instance of ProducerService.
   * @param rabbitmqUrl - URL of the RabbitMQ server.
   * @param exchange - Name of the exchange to publish messages.
   */
  constructor(
    private readonly rabbitmqUrl: string,
    private readonly exchange: string
  ) {
    // Establishes connection to RabbitMQ server and creates a channel wrapper.
    const connection = amqp.connect(this.rabbitmqUrl);
    this.channelWrapper = connection.createChannel({
      // Ensures the exchange is declared upon channel creation.
      setup: (channel: Channel) => {
        return channel.assertExchange(exchange, 'direct', {
          durable: true,
        });
      },
    });
    console.log(`${this.exchange} exchange created`);
  }

  /**
   * Adds a message to the specified queue in the exchange.
   * @param payload - Data to be sent in the message.
   * @param queue - Name of the queue to send the message.
   */
  async addMessageToQueue(payload: any, queue: string) {
    try {
      console.log({ payload, queue });
      // Publishes the message to the specified queue in the exchange.
      await this.channelWrapper.publish(
        this.exchange,
        queue,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
      );

      console.log('Message sent to queue');
    } catch (error) {
      console.log('Error sending message to queue', error);
    }
  }
}
