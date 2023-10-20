import { type DomainEvent, type DomainEventClass } from './DomainEvent'

/**
 * An interface representing a domain event subscriber.
 */
export interface DomainEventSubscriber<T extends DomainEvent> {
  /**
   * Returns an array of DomainClass instances to which
   * the subscriber is subscribed.
   *
   * @returns An array of DomainClass instances.
   */
  subscribedTo: () => DomainEventClass[]

  /**
   * Handles a domain event by implementing specific logic
   * when the event occurs.
   *
   * @param event - The domain event to handle.
   */
  on: (event: T) => Promise<void>
}
