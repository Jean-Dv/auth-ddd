import {
  RedisClientFactory,
  type RedisClientType
} from '@Shared/infrastructure/persistence/redis/RedisClientFactory'

describe('RedisClientFactory', () => {
  let client: RedisClientType
  const factory = RedisClientFactory

  beforeEach(async () => {
    client = await factory.createClient('test', {
      url: 'redis://localhost:6379'
    })
  })

  afterEach(async () => {
    await client.disconnect()
  })

  it('creates a new client with the connection already established', () => {
    expect(client).toBeDefined()
  })

  it('creates a new client if it does not exist a client with the given name', async () => {
    const newClient = await factory.createClient('test2', {
      url: 'redis://localhost:6379'
    })
    expect(newClient).toBeDefined()
    expect(newClient).not.toBe(client)
    await newClient.disconnect()
  })

  it('returns a client if it already exists', async () => {
    const newClient = await factory.createClient('test', {
      url: 'redis://localhost:6379'
    })
    expect(newClient).toBeDefined()
    expect(newClient).toBe(client)
  })
})
