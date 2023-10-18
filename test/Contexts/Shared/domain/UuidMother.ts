import { MotherCreator } from './MotherCreator'

/**
 * A utility class for generating random UUIDs using the Faker library.
 */
export class UuidMother {
  /**
   * Generates and returns a random UUID.
   *
   * @returns A random UUID string.
   */
  public static random(): string {
    return MotherCreator.random().string.uuid()
  }
}
