import { Param } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { EntityIdValidationPipe } from '../pipes/entity-id-validation.pipe';

export const ParamIdValidation = (
  name: string,
  entityClass: EntityClassOrSchema,
  withDeleted = false,
) => Param(name, EntityIdValidationPipe(entityClass, withDeleted));
