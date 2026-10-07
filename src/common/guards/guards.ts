import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Role } from '../../generated/prisma/enums.js';
import {
  AuthUser,
  IS_PUBLIC_KEY,
  ROLES_KEY,
} from '../decorators/decorators.js';
import { forbidden, unauthorized } from '../errors/api-exception.js';

/** Global guard: every route needs a valid JWT unless marked @Public(). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }

  handleRequest<T>(err: unknown, user: T | false): T {
    if (err || !user) {
      throw unauthorized('UNAUTHORIZED', 'Authentication required');
    }
    return user;
  }
}

/** Global guard: enforces @Roles() when present. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles || roles.length === 0) return true;
    const user = context.switchToHttp().getRequest<{ user?: AuthUser }>().user;
    if (!user || !roles.includes(user.role)) {
      throw forbidden('FORBIDDEN', 'You do not have access to this resource');
    }
    return true;
  }
}
