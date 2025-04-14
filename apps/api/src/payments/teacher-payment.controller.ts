// src/payment/teacher-payment.controller.ts
import { Controller, Get, Put, Param, Body, Delete, Req, UseGuards, BadRequestException, Post } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { PaymentService } from './payment.service';
import { UpdatePaymentDto } from './dtos/update-payment.dto';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeacherGuard } from 'src/teacher/guards/teacher.guard';
import { CreatePaymentDto } from './dtos/create-payment.dto';

@ApiTags('teacher-payments')
@Controller('payments/teacher')
@UseGuards(JwtAuthGuard, TeacherGuard)
export class TeacherPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo pagamento manualmente' })
  async create(@Body() createPaymentDto: CreatePaymentDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os pagamentos recebidos pelo professor' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.paymentService.findAllByTeacher(user.userId);
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'Confirma ou atualiza o status de um pagamento' })
  @ApiResponse({ status: 200, description: 'Pagamento atualizado com sucesso.' })
  async confirmPayment(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um pagamento (caso necessário)' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.paymentService.remove(id);
  }
}
