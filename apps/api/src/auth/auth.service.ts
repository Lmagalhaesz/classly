import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Level, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Senha incorreta');

    return user;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      level: user.level, // opcional, caso queira incluir o nível do usuário no token
    };
    return {
      access_token: this.jwtService.sign(payload),
    };

  }
  async registerUser(
    name: string,
    email: string,
    password: string,
    role: Role,
    level: Level,
    groupId?: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        level,
        groupId, // Se não for fornecido, ficará como null.
      },
    });
  }
  


}
