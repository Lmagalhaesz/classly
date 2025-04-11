import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class StudentService {
  /**
   * @param req
   */
  getDashboard(req: Request): { message: string } {
    const user = req.user as { userId: string } | undefined;
    
    if (!user || !user.userId) {
      throw new Error('Usuário não encontrado na requisição.');
    }
    
    return { message: `Dashboard do aluno ${user.userId}` };
  }
}
