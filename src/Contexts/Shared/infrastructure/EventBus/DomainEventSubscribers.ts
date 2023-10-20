import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { type DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber'
import {
  type ContainerBuilder,
  type Definition
} from 'node-dependency-injection'

/**
 * This class is responsible for finding all the domain event subscribers
 */
export class DomainEventSubscribers {
  constructor(public items: Array<DomainEventSubscriber<DomainEvent>>) {}

  /**
   * This method find all the domain event subscribers in the container.
   *
   * @param container - The container builder
   * @returns The domain event subscribers
   */
  public static from(container: ContainerBuilder): DomainEventSubscribers {
    const subscriberDefinitions = container.findTaggedServiceIds(
      'domainEventSubscriber'
    ) as Map<string, Definition>
    const subscribers: Array<DomainEventSubscriber<DomainEvent>> = []
    subscriberDefinitions.forEach((_definition: Definition, key: string) => {
      const domainEventSubscriber = container.get<
        DomainEventSubscriber<DomainEvent>
      >(key.toString())
      subscribers.push(domainEventSubscriber)
    })
    return new DomainEventSubscribers(subscribers)
  }
}
