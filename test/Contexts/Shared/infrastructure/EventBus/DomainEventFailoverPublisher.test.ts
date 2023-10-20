import { FailoverPublisher } from '@Shared/infrastructure/EventBus/FailoverPublisher/FailoverPublisher'
import { MongoEnvironmentArranger } from '../persistence/mongo/MongoEnvironmentArranger'
import { DomainEventDeserializerMother } from './__mother__/DomainEventDeserializerMother'
import { RabbitMQMongoClientMother } from './__mother__/RabbitMQMongoClientMother'
import { DomainEventDummyMother } from './__mother__/DomainEventDummyMother'

describe('DomainEventFailoverPublisher', () => {
  let arranger: MongoEnvironmentArranger
  const mongoClient = RabbitMQMongoClientMother.create()
  const deserializer = DomainEventDeserializerMother.create()

  beforeAll(async () => {
    arranger = new MongoEnvironmentArranger(mongoClient)
  })

  beforeEach(async () => {
    await arranger.arrange()
  })

  afterAll(async () => {
    await mongoClient.then(async (client) => {
      await client.close()
    })
  })

  it('should save the published events', async () => {
    const eventBus = new FailoverPublisher(mongoClient, deserializer)
    const event = DomainEventDummyMother.random()
    await eventBus.publish(event)
    expect(await eventBus.consume()).toEqual([event])
  })
})
