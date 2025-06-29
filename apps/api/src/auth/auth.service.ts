import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { randomUUID } from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Service responsável por autenticação, emissão de tokens e controle de sessões.
 * Integra autenticação JWT, Redis para refresh tokens e segurança baseada em IP/User-Agent.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Registra novo usuário no sistema, validando duplicidade de email.
   */
  async registerUser(registerDto: RegisterUserDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      this.logger.warn({ email: registerDto.email }, 'Tentativa de registro com email duplicado');
      throw new ConflictException('Já existe um usuário com este email.');
    }
    const user = await this.userService.createUser(registerDto);
    this.logger.info({ userId: user.id }, 'Usuário registrado com sucesso');
    return user;
  }

  /**
   * Autentica usuário e gera tokens JWT de acesso e refresh.
   */
  async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn({ email: loginDto.email }, 'Email não encontrado no login');
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      this.logger.warn({ email: loginDto.email }, 'Senha incorreta no login');
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.get<string>('JWT_SECRET'),
      jwtid: jti,
    });

    const refreshToken = await this.createRefreshToken(
      user.id,
      loginDto.userAgent || 'Unknown Browser',
      loginDto.ipAddress || 'Unknown IP',
    );

    this.logger.info({ userId: user.id }, 'Login bem-sucedido, tokens emitidos');
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * Cria e armazena refresh token no Redis com informações de sessão.
   */
  async createRefreshToken(
    userId: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<string> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET não configurado.');

    const jti = randomUUID();
    const refreshToken = this.jwtService.sign({ sub: userId, jti }, {
      expiresIn: '7d',
      secret: refreshSecret,
    });

    const ttl = 7 * 24 * 60 * 60;
    const sessionKey = `session:${jti}`;

    await this.redisService.client.hmset(sessionKey, {
      userId,
      userAgent,
      ipAddress,
      createdAt: new Date().toISOString(),
      refreshToken,
    });
    await this.redisService.client.expire(sessionKey, ttl);

    this.logger.debug({ userId, sessionKey }, 'Sessão criada no Redis');
    return refreshToken;
  }

  /**
   * Renova o access token usando refresh token válido com verificação de dispositivo/IP.
   */
  async refreshToken(
    oldToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    if (!oldToken) throw new UnauthorizedException('Refresh token não foi fornecido.');

    const refreshPayload = this.jwtService.verify(oldToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const jti = refreshPayload.jti;
    const sessionKey = `session:${jti}`;
    const session = await this.redisService.client.hgetall(sessionKey);

    if (!session || Object.keys(session).length === 0) {
      this.logger.warn({ jti }, 'Refresh token não encontrado ou expirado');
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    if (session.userAgent !== userAgent || session.ipAddress !== ipAddress) {
      this.logger.warn({ jti, session }, 'Tentativa de refresh de outro dispositivo/IP');
      throw new UnauthorizedException('Token usado em dispositivo ou IP diferente.');
    }

    await this.redisService.client.del(sessionKey);

    const user = await this.userService.getUserById(session.userId);
    if (!user) throw new UnauthorizedException('Usuário não encontrado.');

    const accessPayload = { sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion };
    const newAccessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
      secret: this.configService.get<string>('JWT_SECRET'),
      jwtid: randomUUID(),
    });

    const newRefreshToken = await this.createRefreshToken(
      user.id,
      session.userAgent,
      session.ipAddress,
    );

    this.logger.info({ userId: user.id }, 'Tokens renovados com sucesso');
    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }

  /**
   * Invalida uma sessão específica baseada no refresh token fornecido.
   */
  async logout(
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ message: string }> {
    if (!refreshToken) throw new UnauthorizedException('Refresh token não fornecido.');

    let jti: string;
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      jti = payload.jti;
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const sessionKey = `session:${jti}`;
    const session = await this.redisService.client.hgetall(sessionKey);

    if (!session || Object.keys(session).length === 0) {
      this.logger.warn({ jti }, 'Tentativa de logout com sessão inexistente');
      throw new UnauthorizedException('Refresh token inválido ou já expirado.');
    }

    if (session.userAgent !== userAgent || session.ipAddress !== ipAddress) {
      this.logger.warn({ sessionKey }, 'Dispositivo/IP não compatível no logout');
      throw new UnauthorizedException('Logout negado: token não pertence a este dispositivo.');
    }

    await this.redisService.client.del(sessionKey);
    this.logger.info({ userId: session.userId }, 'Logout realizado com sucesso');
    return { message: 'Logout realizado com sucesso.' };
  }

  /**
   * Lista todas as sessões ativas do usuário logado.
   */
  async getUserSessions(userId: string): Promise<any[]> {
    const keys = await this.redisService.client.keys('session:*');
    const sessions: any[] = [];
    for (const key of keys) {
      const session = await this.redisService.client.hgetall(key);
      if (session.userId === userId) {
        sessions.push({
          tokenKey: key,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          createdAt: session.createdAt,
        });
      }
    }
    this.logger.debug({ userId, count: sessions.length }, 'Sessões ativas recuperadas');
    return sessions;
  }

  /**
   * Revoga uma sessão específica pertencente ao usuário logado.
   */
  async revokeSession(userId: string, sessionKey: string): Promise<{ message: string }> {
    const session = await this.redisService.client.hgetall(sessionKey);

    if (!session || Object.keys(session).length === 0 || session.userId !== userId) {
      this.logger.warn({ sessionKey }, 'Sessão não encontrada ou não pertence ao usuário');
      throw new UnauthorizedException('Sessão não encontrada ou não autorizada.');
    }

    await this.redisService.client.del(sessionKey);
    this.logger.info({ sessionKey }, 'Sessão revogada com sucesso');
    return { message: 'Sessão revogada com sucesso.' };
  }

  /**
   * Revoga todas as sessões do usuário removendo todos os refresh tokens ativos no Redis.
   */
  async revokeAllSessions(userId: string): Promise<{ message: string }> {
    const keys = await this.redisService.client.keys('session:*');
    let revokedCount = 0;
    for (const key of keys) {
      const session = await this.redisService.client.hgetall(key);
      if (session.userId === userId) {
        await this.redisService.client.del(key);
        revokedCount++;
      }
    }
    this.logger.info({ userId, revokedCount }, 'Todas as sessões revogadas');
    return {
      message: `${revokedCount} sessões revogadas para o usuário ${userId}.`,
    };
  }

  /**
   * Revoga todos os access tokens via incremento do tokenVersion no banco.
   */
  async revokeAllTokens(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    this.logger.info({ userId }, 'Todos os access tokens foram revogados via tokenVersion');
  }
}