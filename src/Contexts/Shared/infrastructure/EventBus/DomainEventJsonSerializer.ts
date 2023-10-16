import { type DomainEvent } from '@Shared/domain/DomainEvent'

/**
 * A class responsible for serializing domain events to JSON format.
 */
export class DomainEventJsonSerializer {
  /**
   * Serializes a domain event to a JSON string.
   *
   * @param event - The domain event to be serialized.
   * @returns A JSON string representing the serialized domain event.
   */
  public static serialize(event: DomainEvent): string {
    return JSON.stringify({
      data: {
        aggregateId: event.aggregateId,
        eventId: event.eventId,
        type: event.eventName,
        occurredOn: event.occurredOn.toISOString(),
        attributes: event.toPrimitives()
      }
    })
  }
}
