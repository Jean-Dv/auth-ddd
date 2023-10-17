import { DomainEventDeserializer } from '@Shared/infrastructure/EventBus/DomainEventDeserializer'
import { DomainEventSubscriberDummy } from '../__mocks__/DomainEventSubscriberDummy'
import { DomainEventSubscribers } from '@Shared/infrastructure/EventBus/DomainEventSubscribers'

/**
 * A factory class for creating instances of the DomainEventDeserializer
 * class for testing purposes.
 */
export class DomainEventDeserializerMother {
  /**
   * Creates and returns an instance of the DomainEventDeserializer class
   * configured with a dummy subscriber for testing purposes.
   *
   * @returns An instance of the DomainEventDeserializer class with a dummy subscriber.
   */
  public static create(): DomainEventDeserializer {
    const dummySubscriber = new DomainEventSubscriberDummy()
    const subscribers = new DomainEventSubscribers([dummySubscriber])
    return DomainEventDeserializer.configure(subscribers)
  }
}
