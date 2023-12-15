import { Param, ParseUUIDPipe } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { EntityIdValidationPipe } from '../pipes/entity-id-validation.pipe';

export const ParamUUIDValidation = (
  name: string,
  entityClass: EntityClassOrSchema,
  withDeleted = false,
) =>
  Param(
    name,
    new ParseUUIDPipe({ version: '4' }),
    EntityIdValidationPipe(entityClass, withDeleted),
  );
