import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { FailoverPublisher } from '@Shared/infrastructure/EventBus/FailoverPublisher/FailoverPublisher'
import { DomainEventDeserializerMother } from '../__mother__/DomainEventDeserializerMother'
import { RabbitMQMongoClientMother } from '../__mother__/RabbitMQMongoClientMother'

/**
 * A double (mock) class for testing FailoverPublisher functionality.
 */
export class DomainEventFailoverPublisherDouble extends FailoverPublisher {
  private readonly publishMock: jest.Mock

  constructor() {
    super(
      RabbitMQMongoClientMother.create(),
      DomainEventDeserializerMother.create()
    )
    this.publishMock = jest.fn()
  }

  /**
   * Mock implementation of the publish method to capture and track calls.
   *
   * @param event - The domain event to be published.
   */
  public async publish(event: DomainEvent): Promise<void> {
    this.publishMock(event)
  }

  /**
   * Asserts that the publish method has been called with the specified event.
   *
   * @param event - The domain event to check for in the method calls.
   */
  public assertEventHasBeenPublished(event: DomainEvent): void {
    expect(this.publishMock).toHaveBeenCalledWith(event)
  }
}
