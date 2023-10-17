import { Uuid } from './value-object/Uuid'

/**
 * An abstract class representing a domain event.
 */
export abstract class DomainEvent {
  public static EVENT_NAME: string
  public readonly aggregateId: string
  public readonly eventId: string
  public readonly occurredOn: Date
  public readonly eventName: string

  constructor(params: {
    eventName: string
    aggregateId: string
    eventId?: string
    occurredOn?: Date
  }) {
    const { eventName, aggregateId, eventId, occurredOn } = params
    this.aggregateId = aggregateId
    this.eventId = eventId ?? Uuid.random().value
    this.occurredOn = occurredOn ?? new Date()
    this.eventName = eventName
  }

  /**
   * An abstract method that must be implemented in derived classes
   * to convert the event into a representation of attributes.
   *
   * @returns {DomainEventAttributes} - The representation of the event.
   */
  public abstract toPrimitives(): DomainEventAttributes

  /**
   * A static method that allows creating an instance of DomainEvent
   * from primitive attributes.
   *
   * @param params {Object} - The primitive attributes required to create the event.
   * @returns {DomainEvent} - An instance of DomainEvent.
   */
  public static fromPrimitives: (params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    attributes: DomainEventAttributes
  }) => DomainEvent
}

/**
 * An interface representing a domain event class.
 */
export interface DomainEventClass {
  /**
   * The name of the event.
   */
  EVENT_NAME: string

  /**
   * A method that allows creating an instance of DomainEvent
   * from primitive attributes.
   *
   * @param params {Object} - The primitive attributes required to create the event.
   * @returns {DomainEvent} - An instance of DomainEvent.
   */
  fromPrimitives: (params: {
    aggregateId: string
    eventId: string
    occurredOn: Date
    attributes: DomainEventAttributes
  }) => DomainEvent
}

/**
 * An interface representing the attributes of a domain event.
 * This must be a defined in derived classes to provide a specific attribute structure.
 */
type DomainEventAttributes = Record<string, unknown>
