import {
  type DomainEvent,
  type DomainEventClass
} from '@Shared/domain/DomainEvent'
import { type DomainEventSubscriber } from '@Shared/domain/DomainEventSubscriber'
import { DomainEventDummy } from './DomainEventDummy'

/**
 * A dummy implementation of a domain event subscriber for testing purposes.
 */
export class DomainEventSubscriberDummy
  implements DomainEventSubscriber<DomainEventDummy>
{
  private readonly events: DomainEvent[]
  private readonly failsFirstTime: boolean = false
  private readonly alwaysFails: boolean = false
  private alreadyFailed: boolean = false

  constructor(params?: { failsFirstTime?: boolean; alwaysFails?: boolean }) {
    if (params?.failsFirstTime === true) {
      this.failsFirstTime = true
    }
    if (params?.alwaysFails === true) {
      this.alwaysFails = true
    }
    this.events = []
  }

  /**
   * Creates and returns a DomainEventSubscriberDummy instance that fails
   * on the first event.
   *
   * @returns A DomainEventSubscriberDummy instance that fails on the first event.
   */
  public static failsFirstTime(): DomainEventSubscriberDummy {
    return new DomainEventSubscriberDummy({ failsFirstTime: true })
  }

  /**
   * Creates and returns a DomainEventSubscriberDummy instance that always fails.
   *
   * @returns A DomainEventSubscriberDummy instance that always fails.
   */
  public static alwaysFails(): DomainEventSubscriberDummy {
    return new DomainEventSubscriberDummy({ alwaysFails: true })
  }

  /**
   * Returns the types of domain events that this subscriber is subscribed to.
   *
   * @returns An array of DomainEventClass types.
   */
  public subscribedTo(): DomainEventClass[] {
    return [DomainEventDummy]
  }

  /**
   * Handles a domain event by storing it in the `events` array. Optionally, it can throw an error
   * based on the subscriber's configuration.
   *
   * @param domainEvent - The domain event to handle.
   */
  public async on(domainEvent: DomainEvent): Promise<void> {
    if (this.alwaysFails) {
      throw new Error("I'm a dummy and I always fail")
    }
    if (!this.alreadyFailed && this.failsFirstTime) {
      this.alreadyFailed = true
      throw new Error("I'm a dummy and I fail the first time'")
    }
    this.events.push(domainEvent)
  }

  /**
   * Asserts that the stored events match the provided events after a delay.
   *
   * @param events - An array of expected domain events.
   */
  public async assertConsumedEvents(events: DomainEvent[]): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        try {
          expect(this.events.length).toEqual(events.length)
          expect(this.events).toEqual(events)
          resolve()
        } catch (error) {
          reject(error)
        }
      }, 400)
    })
  }
}
