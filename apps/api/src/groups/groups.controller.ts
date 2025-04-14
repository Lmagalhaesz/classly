// src/group/group.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { GroupService } from './groups.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova turma' })
  @ApiResponse({ status: 201, description: 'Turma criada com sucesso.' })
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new BadRequestException('Apenas professores podem criar turmas.');
    }
    return this.groupService.create(createGroupDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as turmas do professor' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new BadRequestException('Apenas professores podem visualizar turmas.');
    }
    return this.groupService.findAllByTeacher(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de uma turma pelo id' })
  async findOne(@Param('id') id: string) {
    return this.groupService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma turma' })
  async update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma turma' })
  async remove(@Param('id') id: string) {
    return this.groupService.remove(id);
  }

  @Post(':id/add-student/:studentId')
  @ApiOperation({ summary: 'Adiciona um aluno à turma' })
  async addStudent(@Param('id') groupId: string, @Param('studentId') studentId: string) {
    return this.groupService.addStudent(groupId, studentId);
  }

  @Delete(':id/remove-student/:studentId')
  @ApiOperation({ summary: 'Remove um aluno da turma' })
  async removeStudent(@Param('id') groupId: string, @Param('studentId') studentId: string) {
    return this.groupService.removeStudent(groupId, studentId);
  }
}
