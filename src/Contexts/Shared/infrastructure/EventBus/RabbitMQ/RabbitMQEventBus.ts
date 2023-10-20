import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { type EventBus } from '@Shared/domain/EventBus'
import { DomainEventDeserializer } from '../DomainEventDeserializer'
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer'
import { type DomainEventSubscribers } from '../DomainEventSubscribers'
import { type FailoverPublisher } from '../FailoverPublisher/FailoverPublisher'
import { type RabbitMQConnection } from './RabbitMQConnection'
import { RabbitMQConsumerFactory } from './RabbitMQConsumerFactory'
import { type RabbitMQqueueFormatter } from './RabbitMQqueueFormatter'

/**
 * A class that implements the `EventBus` for publishing domain events and
 * managing event subscribers using RabbitMQ.
 */
export class RabbitMQEventBus implements EventBus {
  private readonly failoverPublisher: FailoverPublisher
  private readonly connection: RabbitMQConnection
  private readonly exchangeName: string
  private readonly queueNameFormatter: RabbitMQqueueFormatter
  private readonly maxRetries: number

  constructor(params: {
    failoverPublisher: FailoverPublisher
    connection: RabbitMQConnection
    exchangeName: string
    queueNameFormatter: RabbitMQqueueFormatter
    maxRetries: number
  }) {
    const {
      failoverPublisher,
      connection,
      exchangeName,
      queueNameFormatter,
      maxRetries
    } = params
    this.failoverPublisher = failoverPublisher
    this.connection = connection
    this.exchangeName = exchangeName
    this.queueNameFormatter = queueNameFormatter
    this.maxRetries = maxRetries
  }

  public async addSubscribers(
    subscribers: DomainEventSubscribers
  ): Promise<void> {
    const deserializer = DomainEventDeserializer.configure(subscribers)
    this.failoverPublisher.setDeserializer(deserializer)
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
      try {
        const routingKey = event.eventName
        const content = this.toBuffer(event)
        const options = this.options(event)
        await this.connection.publish({
          routingKey,
          content,
          options,
          exchange: this.exchangeName
        })
      } catch (error) {
        await this.failoverPublisher.publish(event)
      }
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
