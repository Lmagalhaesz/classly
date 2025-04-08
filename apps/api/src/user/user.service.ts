import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new ConflictException('Email já utilizado por outro usuário.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
        level: createUserDto.level,
        groupId: createUserDto.groupId,
      },
    });
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users;
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return user;
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    // 1. Verifica se o usuário existe.
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const emailUser = await this.prisma.user.findUnique({ where: { email: updateData.email } });
      if (emailUser) {
        throw new ConflictException('O email informado já está sendo utilizado por outro usuário.');
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (existingUser.role !== Role.STUDENT) {
      if (updateData.level !== undefined || updateData.groupId !== undefined) {
        throw new BadRequestException('Somente usuários do tipo STUDENT podem atualizar level ou groupId.');
      }
    }

    // 5. Atualiza os dados do usuário.
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return updatedUser;
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
