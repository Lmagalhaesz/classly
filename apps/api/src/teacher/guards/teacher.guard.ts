import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/types/authenticated-user.interface';

@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    const user = req.user as AuthenticatedUser;
    if (!user || user.role !== Role.TEACHER) {
      throw new ForbiddenException('Apenas professores podem acessar este recurso.');
    }
    return true;
  }
}
