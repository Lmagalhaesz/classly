import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto, teacherId: string) {
    return this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        description: createGroupDto.description,
        teacherId,
      },
    });
  }

  async findAllByTeacher(teacherId: string) {
    return this.prisma.group.findMany({
      where: { teacherId },
      include: { students: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!group) {
      throw new NotFoundException(`Turma com id ${id} não encontrada.`);
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateGroupDto) {
    await this.findOne(id);
    return this.prisma.group.update({
      where: { id },
      data: updateGroupDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.group.delete({
      where: { id },
    });
  }

  async addStudent(groupId: string, studentId: string) {

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

  async removeStudent(groupId: string, studentId: string) {
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