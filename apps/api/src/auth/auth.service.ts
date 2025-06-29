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

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async registerUser(registerDto: RegisterUserDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este email.');
    }
    return this.userService.createUser(registerDto);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const jti = randomUUID();
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.get<string>('JWT_SECRET'),
      jwtid: jti,
    });
    // Passa os metadados extraídos no controller para criar o refresh token
    const refreshToken = await this.createRefreshToken(
      user.id,
      loginDto.userAgent || 'Unknown Browser',
      loginDto.ipAddress || 'Unknown IP',
    );
    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
  @param userId - ID do usuário
  @param jti - O identificador único do access token (para ligar a sessão)
  @param userAgent - Informação do navegador
  @param ipAddress - Endereço IP da requisição
  @returns O refresh token gerado (string)
   */
  async createRefreshToken(
    userId: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<string> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET não configurado.');
    }
  
    // Gera um identificador único da sessão (JWT ID)
    const jti = randomUUID();
  
    // Cria o token com o jti incluído
    const refreshToken = this.jwtService.sign(
      { sub: userId, jti },
      { expiresIn: '7d', secret: refreshSecret },
    );
  
    const ttl = 7 * 24 * 60 * 60;
    const sessionKey = `session:${jti}`;
  
    await this.redisService.client.hmset(sessionKey, {
      userId,
      userAgent,
      ipAddress,
      createdAt: new Date().toISOString(),
      refreshToken, // Opcional: pode guardar o token em si para auditoria
    });
  
    await this.redisService.client.expire(sessionKey, ttl);
  
    console.log(`Sessão armazenada no Redis: ${sessionKey}`);
    return refreshToken;
  }  


  async refreshToken(
    oldToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Verifica se o token é válido
    if (!oldToken) {
      throw new UnauthorizedException('Refresh token não foi fornecido.');
    }
  
    // Verifica se o token é válido
    const refreshPayload = this.jwtService.verify(oldToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const jti = refreshPayload.jti;
  
    const sessionKey = `session:${jti}`;
    const session = await this.redisService.client.hgetall(sessionKey);
  
    // Verifica se a sessão existe
    if (!session || Object.keys(session).length === 0) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

  // Verifica se o token foi revogado
    if (session.userAgent !== userAgent || session.ipAddress !== ipAddress) {
      throw new UnauthorizedException(
        'Token usado em dispositivo ou IP diferente.',
      );
    }
  
    // Revoga o token
    await this.redisService.client.del(sessionKey);
  
    // Cria um novo token de acesso e refresh token
    const user = await this.userService.getUserById(session.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
  
    // Cria o novo token de acesso
    const accessPayload = { sub: user.id, email: user.email, role: user.role };
    const newAccessToken = this.jwtService.sign(accessPayload, {
      expiresIn: '15m',
      secret: this.configService.get<string>('JWT_SECRET'),
      jwtid: randomUUID(),
    });
  
    // Cria o novo refresh token
    const newRefreshToken = await this.createRefreshToken(
      user.id,
      session.userAgent,
      session.ipAddress,
    );
  
    // Retorna os novos tokens
    return { access_token: newAccessToken, refresh_token: newRefreshToken };
  }
    

  async logout(
    refreshToken: string,
    userAgent: string,
    ipAddress: string,
  ): Promise<{ message: string }> {
    
    // Verifica se o token é válido
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não fornecido.');
    }
    let jti: string;
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      jti = payload.jti;
    } catch (e) {
      throw new UnauthorizedException('Refresh token inválido.');
    }
  
    // Verifica se a sessão existe
    const sessionKey = `session:${jti}`;
    const session = await this.redisService.client.hgetall(sessionKey);
    if (!session || Object.keys(session).length === 0) {
      throw new UnauthorizedException('Refresh token inválido ou já expirado.');
    }
  
    // Verifica se o token foi revogado
    if (session.userAgent !== userAgent || session.ipAddress !== ipAddress) {
      throw new UnauthorizedException(
        'Logout negado: token não pertence a este dispositivo.',
      );
    }
  
    // Revoga o token
    await this.redisService.client.del(sessionKey);
    return { message: 'Logout realizado com sucesso.' };
  }
    
  

  async getUserSessions(userId: string): Promise<any[]> {
    // Obtenha todas as chaves de sessão
    const keys = await this.redisService.client.keys('session:*');
    const sessions: any[] = [];
    for (const key of keys) {
      // Recupere os dados da sessão a partir da chave
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
    return sessions;
  }

  async revokeSession(
    userId: string,
    sessionKey: string,
  ): Promise<{ message: string }> {
    const session = await this.redisService.client.hgetall(sessionKey);

    if (
      !session ||
      Object.keys(session).length === 0 ||
      session.userId !== userId
    ) {
      throw new UnauthorizedException(
        'Sessão não encontrada ou não autorizada.',
      );
    }

    await this.redisService.client.del(sessionKey);
    return { message: 'Sessão revogada com sucesso.' };
  }

  async revokeAllSessions(userId: string): Promise<{ message: string }> {
    // Busca todas as chaves de sessão que seguem o padrão "session:*"
    const keys = await this.redisService.client.keys('session:*');

    let revokedCount = 0;
    // Para cada chave, verifica se o refresh token pertence ao usuário
    for (const key of keys) {
      const session = await this.redisService.client.hgetall(key);
      // Verifica se o campo "userId" da sessão corresponde ao usuário fornecido
      if (session.userId === userId) {
        // Revoga a sessão removendo a chave do Redis
        await this.redisService.client.del(key);
        revokedCount++;
      }
    }

    return {
      message: `${revokedCount} sessões revogadas para o usuário ${userId}.`,
    };
  }
}
