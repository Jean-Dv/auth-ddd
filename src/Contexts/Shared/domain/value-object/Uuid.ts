import { v4 as uuid, validate as isValid } from 'uuid'
import { InvalidArgumentError } from './InvalidArgumentError'

/**
 * This class is used to define the value object
 * that will be used to store data id of the aggregate root.
 * And it is used for others objects that need to store an id.
 */
export class Uuid {
  public readonly value: string

  constructor(value: string) {
    this.value = value
    this.ensureIsValidUuid(value)
  }

  /**
   * This method is used to create a new instance of the value object
   * with value random.
   *
   * @returns The new instance of the value object.
   */
  public static random(): Uuid {
    return new Uuid(uuid())
  }

  /**
   * This method is used to validate the value is correct uuid.
   *
   * @param id - The value to validate.
   * @throws If the value is not valid.
   */
  private ensureIsValidUuid(id: string): void {
    if (!isValid(id)) {
      throw new InvalidArgumentError(
        `<${this.constructor.name}> does not allow the value <${id}>`
      )
    }
  }

  /**
   * This method is used to convert in primitive type the value object.
   *
   * @returns The value converted.
   */
  public toString(): string {
    return this.value
  }
}
