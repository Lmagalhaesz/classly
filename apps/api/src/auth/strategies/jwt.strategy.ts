// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { AuthenticatedUser } from '../types/authenticated-user.interface';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: any): Promise<AuthenticatedUser> {
    // 1. Verificar blacklist (se usar)
    if (payload.jti) {
      const isBlacklisted = await this.redisService.client.get(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revogado.');
      }
    }
  
    // 2. Buscar usuário no banco
    const user = await this.userService.getUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
  
    // 3. Comparar tokenVersion
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token expirado ou revogado.');
    }
  
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
  }
  
}
