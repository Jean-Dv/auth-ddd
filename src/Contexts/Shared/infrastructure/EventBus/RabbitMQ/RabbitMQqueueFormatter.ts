import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { type DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber'

/**
 * A class for formatting RabbitMQ queue names for domain events subscribers.
 */
export class RabbitMQqueueFormatter {
  constructor(private readonly moduleName: string) {}

  /**
   * Formats the queue name for the specified domain event subscriber.
   *
   * @param subscriber {DomainEventSubscriber<DomainEvent>} - The domain event subscriber.
   * @returns {string} - The formatted queue name.
   */
  public format(subscriber: DomainEventSubscriber<DomainEvent>): string {
    const value = subscriber.constructor.name
    const name = value
      .split(/(?=[A-Z])/)
      .join('_')
      .toLowerCase()
    return `${this.moduleName}_${name}`
  }

  /**
   * Formats the retry queue name for the specified domain event subscriber.
   *
   * @param subscriber {DomainEventSubscriber<DomainEvent>} - The domain event subscriber.
   * @returns {string} - The formatted retry queue name.
   */
  public formatRetry(subscriber: DomainEventSubscriber<DomainEvent>): string {
    const name = this.format(subscriber)
    return `retry.${name}`
  }

  /**
   * Formats the dead letter queue name for the specified domain event subscriber.
   *
   * @param subscriber {DomainEventSubscriber<DomainEvent>} - The domain event subscriber.
   * @returns {string} - The formatted dead letter queue name.
   */
  public formatDeadLetter(
    subscriber: DomainEventSubscriber<DomainEvent>
  ): string {
    const name = this.format(subscriber)
    return `dead_letter.${name}`
  }
}
