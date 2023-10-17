import { UuidMother } from '../../../domain/UuidMother'
import { DomainEventDummy } from '../__mocks__/DomainEventDummy'

/**
 * A factory class for creating instances of the DomainEventDummy
 * class for testing purposes.
 */
export class DomainEventDummyMother {
  /**
   * Creates and returns a random instance of the DomainEventDummy class with random values for aggregateId, eventId, and occurredOn.
   *
   * @returns A random instance of the DomainEventDummy class.
   */
  public static random(): DomainEventDummy {
    return new DomainEventDummy({
      aggregateId: UuidMother.random(),
      eventId: UuidMother.random(),
      occurredOn: new Date()
    })
  }
}
