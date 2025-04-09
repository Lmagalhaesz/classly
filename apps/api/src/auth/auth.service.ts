// src/auth/auth.service.ts

import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dtos/login.dto';
import { RegisterUserDto } from './dtos/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Endpoint de registro e login (implementações já existentes)
  async registerUser(registerDto: RegisterUserDto) {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Já existe um usuário com este email.');
    }
    return this.userService.createUser(registerDto);
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: this.configService.get('JWT_SECRET'),
    });
    const refreshToken = await this.createRefreshToken(user.id);
    
    return { access_token: accessToken, refresh_token: refreshToken.token };
  }

  async refreshToken(oldToken: string): Promise<{ access_token: string; refresh_token: string }> {
    if (!oldToken) {
      throw new UnauthorizedException('Refresh token não foi fornecido.');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: oldToken },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    if (storedToken.revoked) {
      throw new UnauthorizedException('Refresh token revogado.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado.');
    }

    // Opcional: Revogar o refresh token antigo
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Gerar novo access token
    const user = await this.userService.getUserById(storedToken.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
      secret: this.configService.get('JWT_SECRET'),
    });

    // Gerar novo refresh token
    const newRefreshToken = await this.createRefreshToken(user.id);

    return { access_token: accessToken, refresh_token: newRefreshToken.token };
  }

  // Método auxiliar para criar refresh token (exemplo)
  async createRefreshToken(userId: string): Promise<{ token: string }> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET não configurado.');
    }
    const token = this.jwtService.sign({ sub: userId }, { expiresIn: '7d', secret: refreshSecret });
    const expiresInMs = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
    const expiresAt = new Date(Date.now() + expiresInMs);
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
    return { token };
  }
}
