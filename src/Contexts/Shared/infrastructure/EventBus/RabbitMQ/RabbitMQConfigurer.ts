import { type DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber'
import { type RabbitMQConnection } from './RabbitMQConnection'
import { type RabbitMQqueueFormatter } from './RabbitMQqueueFormatter'
import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { RabbitMQExchangeNameFormatter } from './RabbitMQExchangeNameFormatter'

/**
 * A class responsible for configuring RabbitMQ exchanges, queues
 * and binding for event subscribers.
 */
export class RabbitMQConfigurer {
  constructor(
    private readonly connection: RabbitMQConnection,
    private readonly queueNameFormatter: RabbitMQqueueFormatter,
    private readonly messageRetryTtl: number
  ) {}

  /**
   * Configures RabbitMQ exchanges, queues, and bindings for a set of event subscribers.
   *
   * @param params - Configuration parameters, including exchange name and an array of event subscribers.
   */
  public async configure(params: {
    exchangeName: string
    subscribers: Array<DomainEventSubscriber<DomainEvent>>
  }): Promise<void> {
    const retryExchange = RabbitMQExchangeNameFormatter.retry(
      params.exchangeName
    )
    const deadLetterExchange = RabbitMQExchangeNameFormatter.deadLetter(
      params.exchangeName
    )
    await this.connection.exchange({ name: params.exchangeName })
    await this.connection.exchange({ name: retryExchange })
    await this.connection.exchange({ name: deadLetterExchange })

    for (const subscriber of params.subscribers) {
      await this.addQueue(subscriber, params.exchangeName)
    }
  }

  /**
   * Adds a queue for an event subscriber and configures associated exchanges and bindings.
   *
   * @param subscriber - An event subscriber for which a queue is added and configured.
   * @param exchange - The name of the main exchange to which the subscriber is bound.
   */
  private async addQueue(
    subscriber: DomainEventSubscriber<DomainEvent>,
    exchange: string
  ): Promise<void> {
    const retryExchange = RabbitMQExchangeNameFormatter.retry(exchange)
    const deadLetterExchange =
      RabbitMQExchangeNameFormatter.deadLetter(exchange)
    const routingKeys = this.getRoutingKeysFor(subscriber)
    const queue = this.queueNameFormatter.format(subscriber)
    const retryQueue = this.queueNameFormatter.formatRetry(subscriber)
    const deadLetterQueue = this.queueNameFormatter.formatDeadLetter(subscriber)

    // Connections
    await this.connection.queue({
      routingKeys,
      name: queue,
      exchange
    })
    await this.connection.queue({
      routingKeys,
      name: retryQueue,
      exchange: retryExchange,
      messageTtl: this.messageRetryTtl,
      deadLetterExchange: exchange,
      deadLetterQueue: queue
    })
    await this.connection.queue({
      routingKeys: [queue],
      name: deadLetterQueue,
      exchange: deadLetterExchange
    })
  }

  /**
   * Retrieves the routing keys for an event subscriber, including the subscriber's queue name.
   *
   * @param subscriber - An event subscriber for which routing keys are generated.
   * @returns An array of routing keys, including the subscriber's queue name.
   */
  private getRoutingKeysFor(
    subscriber: DomainEventSubscriber<DomainEvent>
  ): string[] {
    const routingKeys = subscriber
      .subscribedTo()
      .map((event) => event.EVENT_NAME)
    const queue = this.queueNameFormatter.format(subscriber)
    routingKeys.push(queue)
    return routingKeys
  }
}
