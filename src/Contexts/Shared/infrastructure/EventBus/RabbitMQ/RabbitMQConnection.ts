import { type Nullable } from '@Shared/domain/Nullable'
import amqplib, {
  type ConfirmChannel,
  type Connection,
  type ConsumeMessage,
  type MessagePropertyHeaders,
  type Replies
} from 'amqplib'
import { type ConnectionSettings } from './ConnectionSettings'
import { RabbitMQExchangeNameFormatter } from './RabbitMQExchangeNameFormatter'

/**
 * A class for managing a RabbitMQ connection and related operations.
 */
export class RabbitMQConnection {
  protected connectionSettings: ConnectionSettings
  protected connection?: Connection
  protected channel?: ConfirmChannel

  constructor(params: { connectionSettings: ConnectionSettings }) {
    this.connectionSettings = params.connectionSettings
  }

  /**
   * Establishes a connection to the RabbitMQ server and creates a channel.
   */
  public async connect(): Promise<void> {
    this.connection = await this.amqpConnect()
    this.channel = await this.amqpChannel()
  }

  /**
   * Creates or retrieves and exchange on the RabbitMQ server.
   *
   * @param params - Exchange parameters, including the exchange name.
   * @returns A promise that resolves with information about the created or
   * existing exchange.
   */
  public async exchange(params: {
    name: string
  }): Promise<Nullable<Replies.AssertExchange>> {
    return await this.channel?.assertExchange(params.name, 'topic', {
      durable: true
    })
  }

  /**
   * Declares and configures a queue, and binds it to the specified exchange with
   * routing keys.
   *
   * @param params - Queue parameters, including exchange, name, routing keys,
   * and optional dead-letter configuration.
   */
  public async queue(params: {
    exchange: string
    name: string
    routingKeys: string[]
    deadLetterExchange?: string
    deadLetterQueue?: string
    messageTtl?: number
  }): Promise<void> {
    const durable = true
    const exclusive = false
    const autoDelete = false
    const args = this.getQueueArgs(params)
    await this.channel?.assertQueue(params.name, {
      exclusive,
      durable,
      autoDelete,
      arguments: args
    })
    for (const routingKey of params.routingKeys) {
      if (this.channel !== undefined) {
        await this.channel.bindQueue(params.name, params.exchange, routingKey)
      }
    }
  }

  /**
   * Deletes a RabbitMQ queue with the specified name.
   *
   * @param queue - The name of the queue to be deleted.
   * @returns A promise that resolves with information about the deleted queue or null if the queue doesn't exist.
   */
  public async deleteQueue(
    queue: string
  ): Promise<Nullable<Replies.DeleteQueue>> {
    return await this.channel?.deleteQueue(queue)
  }

  /**
   * Starts consuming messages from a RabbitMQ queue and invokes a callback function for each received message.
   *
   * @param queue - The name of the queue to consume messages from.
   * @param onMessage - A callback function to be executed for each received message.
   */
  public async consume(
    queue: string,
    onMessage: (message: ConsumeMessage) => Promise<void>
  ): Promise<void> {
    await this.channel?.consume(queue, (message: ConsumeMessage | null) => {
      if (message !== null) {
        void onMessage(message)
      }
    })
  }

  /**
   * Acknowledges the successful processing of a RabbitMQ message, removing it from the queue.
   *
   * @param message - The RabbitMQ message to be acknowledged.
   */
  public ack(message: ConsumeMessage): void {
    this.channel?.ack(message)
  }

  /**
   * Initiates the retry of a RabbitMQ message by republishing it to a specified exchange and queue.
   *
   * @param message - The RabbitMQ message to be retried.
   * @param queue - The name of the retry queue.
   * @param exchange - The name of the exchange to which the message is republished.
   * @returns A promise that resolves when the retry operation is initiated.
   */
  public async retry(
    message: ConsumeMessage,
    queue: string,
    exchange: string
  ): Promise<void> {
    const retryExchange = RabbitMQExchangeNameFormatter.retry(exchange)
    const options = this.getMessageOptions(message)
    await this.publish({
      exchange: retryExchange,
      routingKey: queue,
      content: message.content,
      options
    })
  }

  /**
   * Moves a RabbitMQ message to a dead letter exchange and queue for further processing.
   *
   * @param message - The RabbitMQ message to be moved to the dead letter queue.
   * @param queue - The name of the dead letter queue.
   * @param exchange - The name of the exchange to which the message is moved.
   * @returns A promise that resolves when the message is successfully moved to the dead letter queue.
   */
  public async deadLetter(
    message: ConsumeMessage,
    queue: string,
    exchange: string
  ): Promise<void> {
    const deadLetterExchange =
      RabbitMQExchangeNameFormatter.deadLetter(exchange)
    const options = this.getMessageOptions(message)
    await this.publish({
      exchange: deadLetterExchange,
      routingKey: queue,
      content: message.content,
      options
    })
  }

  /**
   * Publishes a message to a RabbitMQ exchange with the specified routing key and message content.
   *
   * @param params - Parameters for publishing a message, including exchange, routing key, content, and message options.
   * @returns A promise that resolves when the message is successfully published.
   * @throws Error if no channel is available.
   */
  public async publish(params: {
    exchange: string
    routingKey: string
    content: Buffer
    options: {
      messageId: string
      contentType: string
      contentEncoding: string
      priority?: number
      headers?: Record<string, unknown>
    }
  }): Promise<void> {
    const { routingKey, exchange, content, options } = params
    await new Promise<void>((resolve, reject) => {
      if (this.channel == null) throw new Error('No channel')
      this.channel.publish(exchange, routingKey, content, options, (error) => {
        error !== null ? reject(error) : resolve()
      })
    })
  }

  /**
   * Creates and returns a RabbitMQ channel with confirmation mode, ensuring reliable message delivery.
   *
   * @returns A promise that resolves with a ConfirmChannel instance upon successful channel creation.
   * @throws Error if no connection is established.
   */
  private async amqpChannel(): Promise<ConfirmChannel> {
    if (this.connection == null) throw new Error('No connection')
    const channel = await this.connection.createConfirmChannel()
    await channel.prefetch(1)
    return channel
  }

  /**
   * Establishes a connection to the RabbitMQ server with the specified connection settings.
   *
   * @returns A promise that resolves with a RabbitMQ Connection instance upon successful connection.
   */
  private async amqpConnect(): Promise<Connection> {
    const { hostname, port, secure } = this.connectionSettings.connection
    const { username, password, vhost } = this.connectionSettings
    const protocol = secure ? 'amqps' : 'amqp'
    const connection = await amqplib.connect({
      protocol,
      hostname,
      port,
      username,
      password,
      vhost
    })
    connection.on('error', (err) => {
      void Promise.reject(err)
    })
    return connection
  }

  /**
   * Retrieves message options required for republishing a RabbitMQ message.
   *
   * @param message - The RabbitMQ message for which options are needed.
   * @returns An object containing message options, including messageId,
   * headers, contentType, contentEncoding, and priority.
   */
  private getMessageOptions(message: ConsumeMessage): {
    messageId: string
    headers: Record<string, unknown>
    contentType: string
    contentEncoding: string
    priority: number
  } {
    const { messageId, contentType, contentEncoding, priority } =
      message.properties
    const options = {
      messageId,
      headers: this.incrementRedeliveryCount(message),
      contentType,
      contentEncoding,
      priority
    }
    return options
  }

  /**
   * Generates RabbitMQ queue arguments based on provided parameters.
   *
   * @param params - Queue configuration parameters, including exchange, name, routing keys,
   * dead letter exchange, dead letter queue, and message time-to-live.
   * @returns A record of RabbitMQ queue arguments.
   */
  private getQueueArgs(params: {
    exchange: string
    name: string
    routingKeys: string[]
    deadLetterExchange?: string
    deadLetterQueue?: string
    messageTtl?: number
  }): Record<string, unknown> {
    let args = {}
    if (params.deadLetterExchange !== undefined) {
      args = { ...args, 'x-dead-letter-exchange': params.deadLetterExchange }
    }
    if (params.deadLetterQueue !== undefined) {
      args = { ...args, 'x-dead-letter-routings-key': params.deadLetterQueue }
    }
    if (params.messageTtl !== undefined) {
      args = { ...args, 'x-message-ttl': params.messageTtl }
    }
    return args
  }

  /**
   * Closes the RabbitMQ channel and the connection to the RabbitMQ server.
   */
  public async close(): Promise<void> {
    await this.channel?.close()
    return await this.connection?.close()
  }

  /**
   * Increments the redelivery count in the message properties of a RabbitMQ message.
   *
   * @param message - The RabbitMQ message for which the redelivery count should be incremented.
   * @returns The modified message properties containing the updated redelivery count.
   */
  private incrementRedeliveryCount(
    message: ConsumeMessage
  ): MessagePropertyHeaders {
    if (this.hasBeenRedelivered(message)) {
      const count = parseInt(message.properties.headers.redelivery_count)
      message.properties.headers.redelivery_count = count + 1
    } else {
      message.properties.headers.redelivery_count = 1
    }

    return message.properties.headers
  }

  /**
   * Checks whether a RabbitMQ message has been redelivered based on message properties.
   *
   * @param message - The RabbitMQ message to be checked for redelivery.
   * @returns `true` if the message has been redelivered; `false` otherwise.
   */
  private hasBeenRedelivered(message: ConsumeMessage): boolean {
    return message.properties.headers.redelivery_count !== undefined
  }
}
