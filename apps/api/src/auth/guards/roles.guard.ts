import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtém os papéis necessários para a rota
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Se não houver roles definidas, permite o acesso
    }
    // Pega o usuário da requisição (deverá ter sido setado por um guard de autenticação, ex.: JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }
    // Verifica se o usuário possui algum dos papéis necessários
    return requiredRoles.some((role) => user.role === role);
  }
}
