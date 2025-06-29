import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Req,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt_auth.guard';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';
import { PdfMaterialService } from './pdf.service';
import { CreatePdfMaterialDto } from './dtos/create-pdf.dto';
import { UpdatePdfMaterialDto } from './dtos/update-pdf.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@ApiTags('PDF Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('pdf-materials')
export class PdfController {
  constructor(
    private readonly pdfService: PdfMaterialService,
    @InjectPinoLogger(PdfController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo PDF' })
  @ApiResponse({ status: 201, description: 'PDF criado com sucesso.' })
  async create(@Body() dto: CreatePdfMaterialDto, @Req() req: Request) {
    const teacherId = (req.user as any).userId;
    return this.pdfService.create(dto, teacherId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar PDFs do professor' })
  async findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const teacherId = (req.user as any).userId;
    return this.pdfService.findAll(teacherId, search, Number(page), Number(limit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um PDF' })
  async findOne(@Param('id') id: string) {
    return this.pdfService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um PDF' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePdfMaterialDto,
    @Req() req: Request,
  ) {
    const teacherId = (req.user as any).userId;
    return this.pdfService.update(id, dto, teacherId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mover PDF para lixeira (soft delete)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const teacherId = (req.user as any).userId;
    await this.pdfService.softDelete(id, teacherId);
  }

  @Put(':id/restore')
  @ApiOperation({ summary: 'Restaurar um PDF excluído' })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const teacherId = (req.user as any).userId;
    return this.pdfService.restore(id, teacherId);
  }

  @Delete(':id/hard')
  @HttpCode(204)
  @ApiOperation({ summary: 'Excluir permanentemente o PDF' })
  async hardDelete(@Param('id') id: string, @Req() req: Request) {
    const teacherId = (req.user as any).userId;
    await this.pdfService.hardDelete(id, teacherId);
  }
}
