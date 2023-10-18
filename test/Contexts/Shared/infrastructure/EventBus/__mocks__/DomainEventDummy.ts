import { DomainEvent } from '@Shared/domain/DomainEvent'

/**
 * A concrete class representing a dummy domain event that extends the
 * `DomainEvent` abstract class.
 */
export class DomainEventDummy extends DomainEvent {
  public static readonly EVENT_NAME = 'dummy'

  constructor(params: {
    aggregateId: string
    eventId?: string
    occurredOn?: Date
  }) {
    const { aggregateId, eventId, occurredOn } = params
    super({
      eventName: DomainEventDummy.EVENT_NAME,
      aggregateId,
      eventId,
      occurredOn
    })
  }

  public toPrimitives(): Record<string, string> {
    return {
      id: this.aggregateId,
      event_name: DomainEventDummy.EVENT_NAME,
      eventId: this.eventId,
      occurredOn: this.occurredOn?.toISOString()
    }
  }

  public static fromPrimitives(params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    attributes: Record<string, unknown>
  }): DomainEventDummy {
    const { aggregateId, eventId, occurredOn } = params
    return new DomainEventDummy({
      aggregateId,
      eventId,
      occurredOn
    })
  }
}
