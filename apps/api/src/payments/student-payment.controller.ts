// src/payment/student-payment.controller.ts
import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt_auth.guard';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudentGuard } from 'src/student/guards/student.guard';
import { BuyPaymentPlanDto } from './dtos/buy-payment-plan.dto';

@ApiTags('student-payments')
@Controller('payments/student')
@UseGuards(JwtAuthGuard, StudentGuard)
export class StudentPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('charge')
  @ApiOperation({ summary: 'Inicia o pagamento para o estudante' })
  @ApiResponse({ status: 201, description: 'Pagamento iniciado com sucesso.' })
  async charge(@Body() createPaymentDto: CreatePaymentDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    createPaymentDto.studentId = user.userId;
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os pagamentos do estudante' })
  async findAll(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    return this.paymentService.findAllByStudent(user.userId);
  }

  @Post('buy-plan')
  @ApiOperation({ summary: 'Compra um plano de pagamento e cria um pagamento pendente' })
  @ApiResponse({ status: 201, description: 'Pagamento gerado com sucesso, status PENDING.' })
  async buyPlan(@Body() buyDto: BuyPaymentPlanDto, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    // Use o método purchasePlan para criar o pagamento com status PENDING.
    const payment = await this.paymentService.purchasePlan(buyDto.paymentPlanId, user.userId);
    return payment;
  }
}
