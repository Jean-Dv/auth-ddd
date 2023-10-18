import { type DomainEvent } from '@Shared/domain/DomainEvent'
import { DomainEventDeserializer } from '@Shared/infrastructure/EventBus/DomainEventDeserializer'
import { DomainEventSubscribers } from '@Shared/infrastructure/EventBus/DomainEventSubscribers'
import { type FailoverPublisher } from '@Shared/infrastructure/EventBus/FailoverPublisher/FailoverPublisher'
import { RabbitMQConfigurer } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigurer'
import { type RabbitMQConnection } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection'
import { RabbitMQConsumerFactory } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumerFactory'
import { RabbitMQEventBus } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBus'
import { RabbitMQqueueFormatter } from '@Shared/infrastructure/EventBus/RabbitMQ/RabbitMQqueueFormatter'
import { MongoEnvironmentArranger } from '../persistence/mongo/MongoEnvironmentArranger'
import { DomainEventSubscriberDummy } from './__mocks__/DomainEventSubscriberDummy'
import { DomainEventDummyMother } from './__mother__/DomainEventDummyMother'
import { DomainEventFailoverPublisherMother } from './__mother__/DomainEventFailoverPublisherMother'
import { RabbitMQConnectionMother } from './__mother__/RabbitMQConnectionMother'
import { RabbitMQMongoClientMother } from './__mother__/RabbitMQMongoClientMother'

const event = DomainEventDummyMother.random()

describe('RabbitMQEventBus', () => {
  const exchangeName = 'test_domain_events'
  let arranger: MongoEnvironmentArranger
  const queueNameFormatter = new RabbitMQqueueFormatter('auth')

  beforeAll(async () => {
    arranger = new MongoEnvironmentArranger(RabbitMQMongoClientMother.create())
  })

  beforeEach(async () => {
    await arranger.arrange()
  })

  afterAll(async () => {
    await arranger.close()
  })

  describe('#unit testing', () => {
    it('should use the failover publisher if publish to RabbitMQ fails', async () => {
      const connection = RabbitMQConnectionMother.failOnPublish()
      const failoverPublisher =
        DomainEventFailoverPublisherMother.failOverDouble()
      const eventBus = new RabbitMQEventBus({
        failoverPublisher,
        connection,
        exchangeName,
        queueNameFormatter,
        maxRetries: 3
      })
      await eventBus.publish([event])
      failoverPublisher.assertEventHasBeenPublished(event)
    })
  })

  describe('#integration testing', () => {
    let connection: RabbitMQConnection
    let dummySubscriber: DomainEventSubscriberDummy
    let configurer: RabbitMQConfigurer
    let failoverPublisher: FailoverPublisher
    let subscribers: DomainEventSubscribers

    beforeEach(async () => {
      connection = await RabbitMQConnectionMother.create()
      failoverPublisher = DomainEventFailoverPublisherMother.create()
      configurer = new RabbitMQConfigurer(connection, queueNameFormatter, 50)
      await arranger.arrange()
      dummySubscriber = new DomainEventSubscriberDummy()
      subscribers = new DomainEventSubscribers([dummySubscriber])
    })

    afterEach(async () => {
      await cleanEnvironment()
      await connection.close()
    })

    afterAll(async () => {
      await arranger.close()
    })

    it('should consume the events published to RabbitMQ', async () => {
      await configurer.configure({
        exchangeName,
        subscribers: [dummySubscriber]
      })
      const eventBus = new RabbitMQEventBus({
        failoverPublisher,
        connection,
        exchangeName,
        queueNameFormatter,
        maxRetries: 3
      })
      await eventBus.addSubscribers(subscribers)
      await eventBus.publish([event])
      await dummySubscriber.assertConsumedEvents([event])
    })

    it('should retry failed domain events', async () => {
      dummySubscriber = DomainEventSubscriberDummy.failsFirstTime()
      subscribers = new DomainEventSubscribers([dummySubscriber])
      await configurer.configure({
        exchangeName,
        subscribers: [dummySubscriber]
      })
      const eventBus = new RabbitMQEventBus({
        failoverPublisher,
        connection,
        exchangeName,
        queueNameFormatter,
        maxRetries: 3
      })
      await eventBus.addSubscribers(subscribers)
      await eventBus.publish([event])
      await dummySubscriber.assertConsumedEvents([event])
    })

    it('should send events to dead letter after retry failer', async () => {
      dummySubscriber = DomainEventSubscriberDummy.alwaysFails()
      subscribers = new DomainEventSubscribers([dummySubscriber])
      await configurer.configure({
        exchangeName,
        subscribers: [dummySubscriber]
      })
      const eventBus = new RabbitMQEventBus({
        failoverPublisher,
        connection,
        exchangeName,
        queueNameFormatter,
        maxRetries: 3
      })
      await eventBus.addSubscribers(subscribers)
      await eventBus.publish([event])
      await dummySubscriber.assertConsumedEvents([])
      await assertDeadLetter([event])
    })

    async function cleanEnvironment(): Promise<void> {
      await connection.deleteQueue(queueNameFormatter.format(dummySubscriber))
      await connection.deleteQueue(
        queueNameFormatter.formatRetry(dummySubscriber)
      )
      await connection.deleteQueue(
        queueNameFormatter.formatDeadLetter(dummySubscriber)
      )
    }

    async function assertDeadLetter(events: DomainEvent[]): Promise<void> {
      const connection = await RabbitMQConnectionMother.create()
      const deadLetterQueue =
        queueNameFormatter.formatDeadLetter(dummySubscriber)
      const deadLetterSubscriber = new DomainEventSubscriberDummy()
      const deadLetterSubscribers = new DomainEventSubscribers([
        dummySubscriber
      ])
      const deserializer = DomainEventDeserializer.configure(
        deadLetterSubscribers
      )
      const consumerFactory = new RabbitMQConsumerFactory(
        deserializer,
        connection,
        4
      )
      const consumer = consumerFactory.build(
        deadLetterSubscriber,
        exchangeName,
        deadLetterQueue
      )
      await connection.consume(
        deadLetterQueue,
        consumer.onMessage.bind(consumer)
      )
      await deadLetterSubscriber.assertConsumedEvents(events)
      await connection.close()
    }
  })
})
