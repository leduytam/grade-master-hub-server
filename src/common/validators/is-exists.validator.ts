import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { DataSource } from 'typeorm';

@Injectable()
@ValidatorConstraint({ name: 'IsExists', async: true })
export class IsExists implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0];
    const pathToProperty = validationArguments.constraints[1];

    try {
      const entity: unknown = await this.dataSource
        .getRepository(repository)
        .findOne({
          where: {
            [pathToProperty ? pathToProperty : validationArguments.property]:
              value,
            // pathToProperty ? value?.[pathToProperty] : value,
          },
        });

      return Boolean(entity);
    } catch (err) {
      return false;
    }
  }
}
