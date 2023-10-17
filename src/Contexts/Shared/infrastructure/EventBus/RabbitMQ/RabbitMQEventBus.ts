import { type EventBus } from '@Shared/domain/EventBus'
import { type RabbitMQConnection } from './RabbitMQConnection'
import { type RabbitMQqueueFormatter } from './RabbitMQqueueFormatter'
import { type DomainEventSubscribers } from '../DomainEventSubscribers'
import { DomainEventDeserializer } from '../DomainEventDeserializer'
import { RabbitMQConsumerFactory } from './RabbitMQConsumerFactory'
import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer'

/**
 * A class that implements the `EventBus` for publishing domain events and
 * managing event subscribers using RabbitMQ.
 */
export class RabbitMQEventBus implements EventBus {
  private readonly connection: RabbitMQConnection
  private readonly exchangeName: string
  private readonly queueNameFormatter: RabbitMQqueueFormatter
  private readonly maxRetries: number

  constructor(params: {
    connection: RabbitMQConnection
    exchangeName: string
    queueNameFormatter: RabbitMQqueueFormatter
    maxRetries: number
  }) {
    const { connection, exchangeName, queueNameFormatter, maxRetries } = params
    this.connection = connection
    this.exchangeName = exchangeName
    this.queueNameFormatter = queueNameFormatter
    this.maxRetries = maxRetries
  }

  public async addSubscribers(
    subscribers: DomainEventSubscribers
  ): Promise<void> {
    const deserializer = DomainEventDeserializer.configure(subscribers)
    const consumerFactory = new RabbitMQConsumerFactory(
      deserializer,
      this.connection,
      this.maxRetries
    )
    for (const subscriber of subscribers.items) {
      const queueName = this.queueNameFormatter.format(subscriber)
      const consumer = consumerFactory.build(
        subscriber,
        this.exchangeName,
        queueName
      )
      await this.connection.consume(
        queueName,
        consumer.onMessage.bind(consumer)
      )
    }
  }

  public async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const routingKey = event.eventName
      const content = this.toBuffer(event)
      const options = this.options(event)
      await this.connection.publish({
        routingKey,
        content,
        options,
        exchange: this.exchangeName
      })
    }
  }

  /**
   * Generates options for publishing a domain event.
   *
   * @param event - The domain event for which options are generated.
   * @returns An object containing options for publishing the event.
   */
  private options(event: DomainEvent): {
    messageId: string
    contentType: string
    contentEncoding: string
  } {
    return {
      messageId: event.eventId,
      contentType: 'application/json',
      contentEncoding: 'utf-8'
    }
  }

  /**
   * Converts a domain event to a Buffer for publishing.
   *
   * @param event - The domain event to be converted to a Buffer.
   * @returns A Buffer representation of the serialized domain event.
   */
  private toBuffer(event: DomainEvent): Buffer {
    const eventPrimitives = DomainEventJsonSerializer.serialize(event)
    return Buffer.from(eventPrimitives)
  }
}
