import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class GroupService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Cria uma nova turma.
   * @param createGroupDto Dados para a criação do grupo.
   * @param teacherId ID do professor responsável pela turma.
   * @returns O grupo criado.
   */
  async create(createGroupDto: CreateGroupDto, teacherId: string) {
    // Verificando se o nível foi fornecido no DTO
    if (!createGroupDto.level) {
      this.logger.error(`Nível não fornecido para a turma ${createGroupDto.name}.`);
      throw new BadRequestException('O nível da turma é obrigatório.');
    }

    this.logger.info(`Criando a turma: ${createGroupDto.name} com nível ${createGroupDto.level}.`);

    return this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        description: createGroupDto.description,
        level: createGroupDto.level,
        teacherId,
      },
    });
  }

  /**
   * Retorna todas as turmas de um professor.
   * @param teacherId ID do professor.
   * @returns Lista de turmas.
   */
  async findAllByTeacher(teacherId: string) {
    this.logger.info(`Buscando turmas do professor com id ${teacherId}.`);

    return this.prisma.group.findMany({
      where: { teacherId },
      include: { students: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retorna uma turma específica.
   * @param id ID da turma.
   * @returns A turma encontrada.
   * @throws NotFoundException Se a turma não for encontrada.
   */
  async findOne(id: string) {
    this.logger.info(`Buscando turma com id ${id}.`);

    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!group) {
      this.logger.error(`Turma com id ${id} não encontrada.`);
      throw new NotFoundException(`Turma com id ${id} não encontrada.`);
    }
    return group;
  }

  /**
   * Atualiza uma turma existente.
   * @param id ID da turma.
   * @param updateGroupDto Dados para atualização.
   * @returns A turma atualizada.
   * @throws NotFoundException Se a turma não for encontrada.
   */
  async update(id: string, updateGroupDto: UpdateGroupDto) {
    this.logger.info(`Atualizando turma com id ${id}.`);

    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: updateGroupDto,
    });
  }

  /**
   * Remove uma turma existente.
   * @param id ID da turma.
   * @returns O grupo deletado.
   * @throws NotFoundException Se a turma não for encontrada.
   */
  async remove(id: string) {
    this.logger.info(`Removendo turma com id ${id}.`);

    await this.findOne(id);
    return this.prisma.group.delete({
      where: { id },
    });
  }

  /**
   * Adiciona um aluno a uma turma.
   * @param groupId ID da turma.
   * @param studentId ID do aluno.
   * @returns O grupo com o aluno adicionado.
   * @throws NotFoundException Se a turma não for encontrada.
   */
  async addStudent(groupId: string, studentId: string) {
    this.logger.info(`Adicionando aluno com id ${studentId} à turma com id ${groupId}.`);

    await this.findOne(groupId);

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    });
  }

  /**
   * Remove um aluno de uma turma.
   * @param groupId ID da turma.
   * @param studentId ID do aluno.
   * @returns O grupo com o aluno removido.
   * @throws NotFoundException Se a turma não for encontrada.
   */
  async removeStudent(groupId: string, studentId: string) {
    this.logger.info(`Removendo aluno com id ${studentId} da turma com id ${groupId}.`);

    await this.findOne(groupId);

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    });
  }
}
