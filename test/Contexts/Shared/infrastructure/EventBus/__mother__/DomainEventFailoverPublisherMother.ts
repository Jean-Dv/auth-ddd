import { FailoverPublisher } from '@Shared/infrastructure/EventBus/FailoverPublisher/FailoverPublisher'
import { RabbitMQMongoClientMother } from './RabbitMQMongoClientMother'
import { DomainEventDeserializerMother } from './DomainEventDeserializerMother'
import { DomainEventFailoverPublisherDouble } from '../__mocks__/DomainEventFailoverPublisherDouble'

/**
 * A factory class for creating instances of the FailoverPublisher class for
 * testing purposes.
 */
export class DomainEventFailoverPublisherMother {
  /**
   * Creates and returns an instance of the FailoverPublisher class configured
   * with a MongoDB client and a deserializer for testing purposes.
   *
   * @returns An instance of the FailoverPublisher class with a MongoDB
   * client and deserializer.
   */
  public static create(): FailoverPublisher {
    const mongoClient = RabbitMQMongoClientMother.create()
    return new FailoverPublisher(
      mongoClient,
      DomainEventDeserializerMother.create()
    )
  }

  /**
   * Creates and returns a double of the FailoverPublisher class for testing purposes.
   *
   * @returns A double of the FailoverPublisher class.
   */
  public static failOverDouble(): DomainEventFailoverPublisherDouble {
    return new DomainEventFailoverPublisherDouble()
  }
}
