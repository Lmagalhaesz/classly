// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
// Caso você esteja utilizando Redis para blacklist, importe o RedisService.
// Se ainda não estiver usando ou não quiser a verificação de blacklist, pode remover essa parte.
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../types/authenticated-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,  // Remova ou comente se não usar blacklist
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  /**
   * Valida o token JWT extraído do header.
   * Se estiver utilizando uma blacklist (por exemplo, armazenada no Redis), o token é rejeitado se encontrado.
   * Retorna as informações essenciais do usuário (userId, email e role) para serem utilizadas nos guards e endpoints.
   */
  async validate(payload: any): Promise<AuthenticatedUser> {
    // Se estiver usando blacklist e o payload incluir o `jti` (JWT ID), verifique:
    if (payload.jti) {
      const isBlacklisted = await this.redisService.client.get(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revogado.');
      }
    }
    // Retorne o objeto com as informações do usuário. Esses valores devem estar presentes no payload.
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
