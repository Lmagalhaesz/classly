// src/payment-plan/payment-plan.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { PaymentPlanService } from './payment-plan.service';
import { CreatePaymentPlanDto } from './dtos/create-payment-plan.dto';
import { UpdatePaymentPlanDto } from './dtos/update-payment-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('payment-plans')
@Controller('payment-plans')
@UseGuards(JwtAuthGuard)
export class PaymentPlanController {
  constructor(private readonly paymentPlanService: PaymentPlanService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo plano de pagamento recorrente' })
  @ApiResponse({ status: 201, description: 'Plano de pagamento criado com sucesso.' })
  async create(@Body() createPaymentPlanDto: CreatePaymentPlanDto, @Req() req: Request) {
    // Extraia o teacherId do usuário autenticado (deve ser professor)
    const user = req.user as { userId: string, role: string };
    return this.paymentPlanService.create(createPaymentPlanDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os planos de pagamento do professor' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string, role: string };
    return this.paymentPlanService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna os detalhes de um plano de pagamento pelo id' })
  async findOne(@Param('id') id: string) {
    return this.paymentPlanService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um plano de pagamento pelo id' })
  async update(@Param('id') id: string, @Body() updatePaymentPlanDto: UpdatePaymentPlanDto) {
    return this.paymentPlanService.update(id, updatePaymentPlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um plano de pagamento pelo id' })
  async remove(@Param('id') id: string) {
    return this.paymentPlanService.remove(id);
  }
}
