import {
  ArgumentMetadata,
  Injectable,
  NotFoundException,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { DataSource } from 'typeorm';

export const EntityIdValidationPipe = (
  entityClass: EntityClassOrSchema,
  withDeleted = false,
): Type<PipeTransform> => {
  @Injectable()
  class EntityIdValidationMixinPipe implements PipeTransform {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async transform(id: string, _metadata: ArgumentMetadata): Promise<string> {
      const entity = await this.dataSource.getRepository(entityClass).findOne({
        where: { id },
        withDeleted,
      });

      const name =
        entityClass instanceof Function
          ? entityClass.name
          : entityClass.options.name;

      if (!entity) {
        throw new NotFoundException(`${name} with id "${id}" not found`);
      }

      return id;
    }
  }

  return EntityIdValidationMixinPipe;
};
