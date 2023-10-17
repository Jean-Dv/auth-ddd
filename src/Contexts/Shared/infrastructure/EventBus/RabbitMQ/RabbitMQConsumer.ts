import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { type DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber'
import { type DomainEventDeserializer } from '../DomainEventDeserializer'
import { type RabbitMQConnection } from './RabbitMQConnection'
import { type ConsumeMessage } from 'amqplib'

/**
 * A class responsible for consuming and processing domain
 * events from a RabbitMQ queue.
 */
export class RabbitMQConsumer {
  private readonly subscriber: DomainEventSubscriber<DomainEvent>
  private readonly deserializer: DomainEventDeserializer
  private readonly connection: RabbitMQConnection
  private readonly maxRetries: number
  private readonly queueName: string
  private readonly exchangeName: string

  constructor(params: {
    subscriber: DomainEventSubscriber<DomainEvent>
    deserializer: DomainEventDeserializer
    connection: RabbitMQConnection
    queueName: string
    exchangeName: string
    maxRetries: number
  }) {
    this.subscriber = params.subscriber
    this.deserializer = params.deserializer
    this.connection = params.connection
    this.queueName = params.queueName
    this.exchangeName = params.exchangeName
    this.maxRetries = params.maxRetries
  }

  /**
   * Handles a received RabbitMQ message, including deserialization,
   * subscriber execution, and error handling.
   *
   * @param message - The received RabbitMQ message to be processed.
   */
  public async onMessage(message: ConsumeMessage): Promise<void> {
    const content = message.content.toString()
    const domainEvent = this.deserializer.deserialize(content)
    try {
      await this.subscriber.on(domainEvent)
    } catch (error) {
      await this.handleError(message)
    } finally {
      this.connection.ack(message)
    }
  }

  /**
   * Handles errors during event processing by determining whether
   * to retry or dead-letter the message.
   *
   * @param message - The RabbitMQ message that encountered an error during processing.
   */
  private async handleError(message: ConsumeMessage): Promise<void> {
    if (this.hasBeedRedeliveredTooMuch(message)) {
      await this.deadLetter(message)
    } else {
      await this.retry(message)
    }
  }

  /**
   * Retries a RabbitMQ message by sending it to the appropriate retry exchange.
   *
   * @param message - The RabbitMQ message to be retried.
   */
  private async retry(message: ConsumeMessage): Promise<void> {
    await this.connection.retry(message, this.queueName, this.exchangeName)
  }

  /**
   * Dead-letters a RabbitMQ message, marking it as permanently unprocessable.
   *
   * @param message - The RabbitMQ message to be dead-lettered.
   */
  private async deadLetter(message: ConsumeMessage): Promise<void> {
    await this.connection.deadLetter(message, this.queueName, this.exchangeName)
  }

  /**
   * Checks if a message has been redelivered too many times, exceeding the maximum
   * allowed retries.
   *
   * @param message - The RabbitMQ message to be checked for excessive redelivery.
   * @returns `true` if the message has been redelivered too many times, `false` otherwise.
   */
  private hasBeedRedeliveredTooMuch(message: ConsumeMessage): boolean {
    if (this.hasBeenRedelivered(message)) {
      const count = parseInt(message.properties.headers.redelivery_count)
      return count >= this.maxRetries
    }
    return false
  }

  /**
   * Checks if a message has been redelivered based on message properties.
   *
   * @param message - The RabbitMQ message to be checked for redelivery.
   * @returns `true` if the message has been redelivered, `false` otherwise.
   */
  private hasBeenRedelivered(message: ConsumeMessage): boolean {
    return message.properties.headers.redelivery_count !== undefined
  }
}
