import {
  type DomainEvent,
  type DomainEventClass
} from '@Shared/domain/DomainEvent'
import { type DomainEventSubscribers } from './DomainEventSubscribers'

interface DomainEventJson {
  type: string
  aggregateId: string
  eventId: string
  attributes: string
  occurredOn: string
}

/**
 * This class is used to deserialize a domain event from json.
 */
export class DomainEventDeserializer extends Map<string, DomainEventClass> {
  /**
   * This method configures the derializer with the provided domain events.
   *
   * @param subscribers - The subscribers to be used to configure the deserializer.
   * @returns The deserializer configured with the provided subscribers.
   */
  public static configure(
    subscribers: DomainEventSubscribers
  ): DomainEventDeserializer {
    const mapping = new DomainEventDeserializer()
    subscribers.items.forEach((subscriber) => {
      subscriber.subscribedTo().forEach(mapping.registerEvent.bind(mapping))
    })
    return mapping
  }

  /**
   * This method registers the provided domain event in the deserializer.
   *
   * @param domainEvent - The domain event to be registered.
   */
  private registerEvent(domainEvent: DomainEventClass): void {
    const eventName = domainEvent.EVENT_NAME
    this.set(eventName, domainEvent)
  }

  /**
   * This method deserializes the provided event.
   *
   * @param event - The event to be deserialized.
   * @returns The deserialized event.
   */
  public deserialize(event: string): DomainEvent {
    const eventData = JSON.parse(event).data as DomainEventJson
    const { type, aggregateId, attributes, occurredOn, eventId } = eventData
    const eventClass = super.get(type)
    if (eventClass == null) {
      throw Error(`DomainEvent mapping not found for event ${type}`)
    }
    return eventClass.fromPrimitives({
      aggregateId,
      attributes,
      occurredOn: new Date(occurredOn),
      eventId
    })
  }
}
