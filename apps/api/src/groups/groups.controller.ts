import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  UseGuards,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GroupService } from './groups.service';
import { CreateGroupDto } from './dtos/create-group.dto';
import { UpdateGroupDto } from './dtos/update-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse, ApiConflictResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('groups')
@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupController {

  constructor(private readonly groupService: GroupService) {}


  /**
   * Cria uma nova turma no sistema. Somente usuários com a role de professor ou administrador podem realizar essa ação.
   * Verifica se a turma já existe para evitar conflitos.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Cria uma nova turma' })
  @ApiResponse({
    status: 201,
    description: 'Turma criada com sucesso.',
    schema: {
      example: {
        statusCode: 201,
        message: 'Turma criada com sucesso.',
        data: {
          id: '12345',
          name: 'Turma de Java',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Dados inválidos na requisição.' })
  @ApiConflictResponse({ description: 'Já existe uma turma ativa com dados conflitantes.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno no servidor.' })
  async create(@Body() createGroupDto: CreateGroupDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };

    // Valida se o usuário tem permissão para criar turmas
    if (user.role !== Role.TEACHER && user.role !== Role.ADMIN) {
      throw new BadRequestException('Apenas professores ou administradores podem criar turmas.');
    }

    try {
      const group = await this.groupService.create(createGroupDto, user.userId);
      return {
        statusCode: 201,
        message: 'Turma criada com sucesso.',
        data: group,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException('Já existe uma turma ativa com o mesmo nome ou dados conflitantes.');
      }
      throw new InternalServerErrorException('Erro interno ao criar a turma.');
    }
  }


  /**
   * Lista todas as turmas associadas ao professor que fez a requisição.
   * A consulta verifica as turmas disponíveis para o professor autenticado.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Lista todas as turmas do professor' })
  @ApiResponse({
    status: 200,
    description: 'Listagem de turmas com sucesso.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Listagem de turmas realizada com sucesso.',
        data: [
          {
            id: '12345',
            name: 'Turma de Java',
            level: 'INTERMEDIATE',
          },
        ],
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao listar as turmas.' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    try {
      const groups = await this.groupService.findAllByTeacher(user.userId);
      return {
        statusCode: 200,
        message: 'Listagem de turmas realizada com sucesso.',
        data: groups,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao listar as turmas.');
    }
  }


  /**
   * Retorna os detalhes de uma turma pelo ID. Se a turma não for encontrada, um erro 404 é retornado.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de uma turma pelo id' })
  @ApiResponse({
    status: 200,
    description: 'Turma encontrada com sucesso.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Turma encontrada com sucesso.',
        data: {
          id: '12345',
          name: 'Turma de Java',
          level: 'INTERMEDIATE',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao buscar a turma.' })
  async findOne(@Param('id') id: string) {
    try {
      const group = await this.groupService.findOne(id);
      return {
        statusCode: 200,
        message: 'Turma encontrada com sucesso.',
        data: group,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao buscar a turma.');
    }
  }


  /**
   * Atualiza os dados de uma turma. A turma é identificada pelo ID, e o usuário precisa ter permissão para atualizar.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza os dados de uma turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma atualizada com sucesso.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Turma atualizada com sucesso.',
        data: {
          id: '12345',
          name: 'Turma de Java Atualizada',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao atualizar a turma.' })
  async update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    try {
      const updatedGroup = await this.groupService.update(id, updateGroupDto);
      return {
        statusCode: 200,
        message: 'Turma atualizada com sucesso.',
        data: updatedGroup,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao atualizar a turma.');
    }
  }


  /**
   * Remove uma turma do sistema. O usuário precisa ter permissão para remover a turma.
   * Caso a turma não seja encontrada, será lançado um erro 404.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma turma' })
  @ApiResponse({
    status: 200,
    description: 'Turma removida com sucesso.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Turma removida com sucesso.',
        data: {
          id: '12345',
          name: 'Turma de Java',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Turma não encontrada.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao remover a turma.' })
  async remove(@Param('id') id: string) {
    try {
      const deletedGroup = await this.groupService.remove(id);
      return {
        statusCode: 200,
        message: 'Turma removida com sucesso.',
        data: deletedGroup,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao remover a turma.');
    }
  }


  /**
   * Adiciona um aluno a uma turma. O aluno é identificado pelo ID, e a turma pelo ID fornecido.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Post(':id/add-student/:studentId')
  @ApiOperation({ summary: 'Adiciona um aluno à turma' })
  @ApiResponse({
    status: 200,
    description: 'Aluno adicionado à turma com sucesso.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Aluno adicionado à turma com sucesso.',
        data: {
          id: '12345',
          name: 'Turma de Java',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Turma ou aluno não encontrados.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao adicionar o aluno à turma.' })
  async addStudent(@Param('id') groupId: string, @Param('studentId') studentId: string) {
    try {
      const updatedGroup = await this.groupService.addStudent(groupId, studentId);
      return {
        statusCode: 200,
        message: 'Aluno adicionado à turma com sucesso.',
        data: updatedGroup,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao adicionar o aluno à turma.');
    }
  }


  /**
   * Remove um aluno de uma turma. O aluno é identificado pelo ID, e a turma pelo ID fornecido.
   */
  @Roles(Role.TEACHER, Role.ADMIN)
  @Delete(':id/remove-student/:studentId')
  @ApiOperation({ summary: 'Remove um aluno da turma' })
  @ApiResponse({
    status: 200,
    description: 'Aluno removido da turma com sucesso.',
    schema: {
      example: {
        statusCode: 200,
        message: 'Aluno removido da turma com sucesso.',
        data: {
          id: '12345',
          name: 'Turma de Java',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Turma ou aluno não encontrados.' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao remover o aluno da turma.' })
  async removeStudent(@Param('id') groupId: string, @Param('studentId') studentId: string) {
    try {
      const updatedGroup = await this.groupService.removeStudent(groupId, studentId);
      return {
        statusCode: 200,
        message: 'Aluno removido da turma com sucesso.',
        data: updatedGroup,
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro interno ao remover o aluno da turma.');
    }
  }
}
