import { SetMetadata } from '@nestjs/common';
import { EUserRole } from 'src/models/users/types/user-roles.enum';

export const Roles = (...roles: EUserRole[]) => SetMetadata('roles', roles);
