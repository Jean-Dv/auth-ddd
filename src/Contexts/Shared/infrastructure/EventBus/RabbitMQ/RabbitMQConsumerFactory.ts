import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { type DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber'
import { type DomainEventDeserializer } from '../DomainEventDeserializer'
import { type RabbitMQConnection } from './RabbitMQConnection'
import { RabbitMQConsumer } from './RabbitMQConsumer'

/**
 * A factory class for creating instances of the `RabbitMQConsumer` to
 * consume and process domain events.
 */

export class RabbitMQConsumerFactory {
  constructor(
    private readonly deserializer: DomainEventDeserializer,
    private readonly connection: RabbitMQConnection,
    private readonly maxRetries: number
  ) {}

  /**
   * Builds and returns a new `RabbitMQConsumer` instance for the given subscriber, exchange, and queue.
   *
   * @param subscriber - An event subscriber for which the consumer is built.
   * @param exchange - The name of the exchange to which the subscriber is bound.
   * @param queueName - The name of the queue from which the subscriber consumes messages.
   * @returns A new `RabbitMQConsumer` instance for the specified configuration.
   */
  public build(
    subscriber: DomainEventSubscriber<DomainEvent>,
    exchangeName: string,
    queueName: string
  ): RabbitMQConsumer {
    return new RabbitMQConsumer({
      subscriber,
      deserializer: this.deserializer,
      connection: this.connection,
      queueName,
      exchangeName,
      maxRetries: this.maxRetries
    })
  }
}
