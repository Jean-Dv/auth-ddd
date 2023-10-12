import { MongoClient } from 'mongodb'
import { MongoClientFactory } from '../../../../../src/Contexts/Shared/infrastructure/mongo/MongoClientFactory'

describe('MongoClientFactory', () => {
  let client: MongoClient
  const factory = MongoClientFactory

  beforeEach(async () => {
    client = await factory.createClient('test', {
      url: 'mongodb://localhost:27017/auth-backend-test1'
    })
  })

  afterEach(async () => {
    await client.close()
  })

  it('creates a new client with the connection already established', () => {
    expect(client).toBeInstanceOf(MongoClient)
  })

  it('creates a new client if it does not exist a client with the given name', async () => {
    const newClient = await factory.createClient('test2', {
      url: 'mongodb://localhost:27017/auth-backend-test2'
    })
    expect(newClient).toBeInstanceOf(MongoClient)
    expect(newClient).not.toBe(client)
    await newClient.close()
  })

  it('returns a client if it a already exists', async () => {
    const newClient = await factory.createClient('test', {
      url: 'mongodb://localhost:27017/auth-backend-test3'
    })
    expect(newClient).toBeInstanceOf(MongoClient)
    expect(newClient).toBe(client)
    await newClient.close()
  })
})
