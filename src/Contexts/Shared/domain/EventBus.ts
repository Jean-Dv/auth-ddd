import { type DomainEventSubscribers } from '@Shared/infrastructure/EventBus/DomainEventSubscribers'
import { type DomainEvent } from './DomainEvent'

/**
 * An interface representing an event bus for publishing domain
 * events and managing event subscribers.
 */
export interface EventBus {
  /**
   * Publishes an array of domain events to the event bus for distribution.
   *
   * @param events - An array of domain events to be published.
   */
  publish: (events: DomainEvent[]) => Promise<void>

  /**
   * Adds event subscribers to the event bus for handling incoming events.
   *
   * @param subscribers - The event subscribers to be added to the event bus.
   */
  addSubscribers: (subscribers: DomainEventSubscribers) => void
}
