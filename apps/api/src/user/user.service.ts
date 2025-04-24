import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo usuário com as validações apropriadas
   * - Garante que o email seja único
   * - Hash da senha
   * - Permite definir nível e grupo apenas para STUDENT
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, role, level, groupId } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email já utilizado por outro usuário.');
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário com base no DTO
    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email,
        password: hashedPassword,
        role,
        level: role === Role.STUDENT ? level : undefined,
        groupId: role === Role.STUDENT ? groupId : undefined,
        isCompanyCreator: false, // padrão inicial (pode ser alterado via painel)
      },
    });

    return user;
  }

  /**
   * Retorna todos os usuários cadastrados
   * (futuramente pode ser adaptado para paginação ou filtros)
   */
  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  /**
   * Busca um único usuário pelo ID
   * Lança erro caso não encontrado
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return user;
  }

  /**
   * Atualiza os dados de um usuário com validações específicas:
   * - Email não pode estar em uso por outro usuário
   * - Somente alunos podem alterar nível e grupo
   * - Senha é rehashada se for atualizada
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // Validação de e-mail único
    if (updateData.email && updateData.email !== user.email) {
      const emailTaken = await this.prisma.user.findUnique({ where: { email: updateData.email } });
      if (emailTaken) {
        throw new ConflictException('O email informado já está sendo utilizado por outro usuário.');
      }
    }

    // Hash da nova senha (se for atualizada)
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Apenas alunos podem atualizar `level` e `groupId`
    if (user.role !== Role.STUDENT && (updateData.level !== undefined || updateData.groupId !== undefined)) {
      throw new BadRequestException('Somente usuários do tipo STUDENT podem alterar level ou groupId.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return updatedUser;
  }

  /**
   * Exclui um usuário permanentemente do banco
   * (pode ser ajustado futuramente para soft delete via deletedAt)
   */
  async deleteUser(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Busca usuário pelo email (comum para login)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
