import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ActivityService } from './activities.service';
import { CreateActivityDto } from './dtos/create-activity.dto';
import { UpdateActivityDto } from './dtos/update-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova atividade com level' })
  @ApiResponse({ status: 201, description: 'Atividade criada com sucesso.' })
  async create(@Body() createActivityDto: CreateActivityDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.activityService.create(createActivityDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as atividades' })
  async findAll() {
    return this.activityService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de uma atividade pelo id' })
  async findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma atividade' })
  async update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activityService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma atividade' })
  async remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
