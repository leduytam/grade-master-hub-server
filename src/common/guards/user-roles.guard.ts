import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { EUserRole } from 'src/models/users/types/user-roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<EUserRole[]>('roles', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!roles.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest<Request>();

    return roles.includes(request.user?.role);
  }
}
