import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { type Collection, type MongoClient } from 'mongodb'
import { type DomainEventDeserializer } from '../DomainEventDeserializer'
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer'

/**
 * A class for publishing and consuming domain events using a
 * failover strategy with a MongoDB collection.
 */
export class FailoverPublisher {
  protected static collectionName = 'domain_events_failover'

  constructor(
    private readonly _client: Promise<MongoClient>,
    private deserializer?: DomainEventDeserializer
  ) {}

  /**
   * Retrieves the MongoDB collection used for failover event storage.
   *
   * @returns A promise that resolves to the MongoDB collection for failover event storage.
   */
  protected async collection(): Promise<Collection> {
    return (await this._client)
      .db()
      .collection(FailoverPublisher.collectionName)
  }

  /**
   * Publishes a domain event to the failover storage in MongoDB.
   *
   * @param event - The domain event to be published.
   */
  public async publish(event: DomainEvent): Promise<void> {
    const collection = await this.collection()
    const eventSerialized = DomainEventJsonSerializer.serialize(event)
    const options = { upsert: true }
    const update = {
      $set: {
        eventId: event.eventId,
        event: eventSerialized
      }
    }

    await collection.updateOne({ eventId: event.eventId }, update, options)
  }

  /**
   * Consumes a batch of domain events from the failover storage in MongoDB.
   *
   * @returns An array of deserialized domain events that have been consumed,
   * or undefined for failed deserialization.
   * @throws An error if the deserializer has not been set.
   */
  public async consume(): Promise<Array<DomainEvent | undefined>> {
    const collection = await this.collection()
    const documents = await collection.find().limit(200).toArray()
    if (this.deserializer == null) {
      throw new Error(`Deserializer has not been set yet`)
    }
    const events = documents.map((document) => {
      if (this.deserializer != null) {
        return this.deserializer.deserialize(document.event)
      }
      return undefined
    })
    return events.filter(Boolean)
  }

  /**
   * Sets the domain event deserializer for deserializing consumed events.
   *
   * @param deserializer - The domain event deserializer to be used.
   */
  public setDeserializer(deserializer: DomainEventDeserializer): void {
    this.deserializer = deserializer
  }
}
