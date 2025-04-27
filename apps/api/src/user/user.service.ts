import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dtos/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role, User } from '@prisma/client';
import { UpdateUserDto } from './dtos/update-user.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/**
 * Service responsável pelas operações relacionadas ao modelo de usuário.
 * Implementa criação, listagem, busca, atualização e exclusão de usuários,
 * além de autenticação baseada em email.
 */
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,

    /**
     * Logger estruturado baseado no Pino, para rastreabilidade e métricas.
     */
    @InjectPinoLogger(UserService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Cria um novo usuário no sistema após verificar se o email já está em uso.
   * @param createUserDto Dados para criação de usuário.
   * @returns Usuário criado.
   */
  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      this.logger.warn({ email: createUserDto.email }, 'Email já cadastrado');
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
        isCompanyCreator: false,
      },
    });

    this.logger.info({ userId: user.id }, 'Usuário criado com sucesso');
    return user;
  }

  /**
   * Lista todos os usuários cadastrados.
   * @returns Array de usuários.
   */
  async getAllUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    this.logger.info({ count: users.length }, 'Listagem de usuários');
    return users;
  }

  /**
   * Busca um usuário específico por ID.
   * @param id ID do usuário.
   * @returns Usuário encontrado.
   */
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      this.logger.warn({ userId: id }, 'Usuário não encontrado');
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    this.logger.info({ userId: id }, 'Usuário encontrado');
    return user;
  }

  /**
   * Atualiza os dados de um usuário existente, realizando validações de email e tipo de role.
   * @param id ID do usuário a ser atualizado.
   * @param updateData Campos atualizáveis.
   * @returns Usuário atualizado.
   */
  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      this.logger.warn({ userId: id }, 'Usuário para atualização não encontrado');
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const emailUser = await this.prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (emailUser) {
        this.logger.warn({ email: updateData.email }, 'Email em uso por outro usuário');
        throw new ConflictException('O email informado já está sendo utilizado por outro usuário.');
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (existingUser.role !== Role.STUDENT) {
      if (updateData.level !== undefined || updateData.groupId !== undefined) {
        this.logger.warn({ userId: id }, 'Tentativa de alterar atributos exclusivos de STUDENT');
        throw new BadRequestException('Somente usuários do tipo STUDENT podem atualizar level ou groupId.');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    this.logger.info({ userId: id }, 'Usuário atualizado com sucesso');
    return updatedUser;
  }

  /**
   * Remove um usuário do sistema com base no ID.
   * @param id ID do usuário a ser excluído.
   */
  async deleteUser(id: string) {
    const deletedUser = await this.prisma.user.delete({ where: { id } });
    this.logger.info({ userId: id }, 'Usuário excluído com sucesso');
    return deletedUser;
  }

  /**
   * Busca um usuário pelo email (útil para autenticação).
   * @param email Email do usuário.
   * @returns Usuário encontrado ou null.
   */
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    this.logger.debug({ email }, 'Busca de usuário por email');
    return user;
  }
}
