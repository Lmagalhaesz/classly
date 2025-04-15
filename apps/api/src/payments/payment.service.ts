// src/payment/payment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { UpdatePaymentDto } from './dtos/update-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    return this.prisma.payment.create({
      data: {
        studentId: createPaymentDto.studentId,
        teacherId: createPaymentDto.teacherId,
        amount: createPaymentDto.amount,
        dueDate: new Date(createPaymentDto.dueDate),
        paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : null,
        status: createPaymentDto.status,
      },
    });
  }

  async findAll() {
    return this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByStudent(studentId: string) {
    return this.prisma.payment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByTeacher(teacherId: string) {
    return this.prisma.payment.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Pagamento com id ${id} não encontrado.`);
    }
    return payment;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    await this.findOne(id);
    return this.prisma.payment.update({
      where: { id },
      data: {
        ...updatePaymentDto,
        dueDate: updatePaymentDto.dueDate ? new Date(updatePaymentDto.dueDate) : undefined,
        paymentDate: updatePaymentDto.paymentDate ? new Date(updatePaymentDto.paymentDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.payment.delete({
      where: { id },
    });
  }

  async purchasePlan(paymentPlanId: string, studentId: string) {
    // Busque o plano de pagamento
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id: paymentPlanId },
    });
    if (!plan) {
      throw new NotFoundException('Plano de pagamento não encontrado.');
    }
    
    // Opcional: você pode calcular a data de vencimento com base na recorrência e na data de início
    // Aqui usaremos a startDate como dueDate, mas essa lógica pode ser aprimorada.
    const dueDate = plan.startDate;
    
    // Cria o registro de pagamento com status PENDING
    return this.prisma.payment.create({
      data: {
        studentId,
        teacherId: plan.teacherId,
        planId: plan.id,
        amount: plan.amount,
        dueDate: new Date(dueDate),
        status: 'PENDING',
      },
    });
  }
}
