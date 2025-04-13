import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentPlanDto } from './dtos/create-payment-plan.dto';
import { UpdatePaymentPlanDto } from './dtos/update-payment-plan.dto';

@Injectable()
export class PaymentPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentPlanDto: CreatePaymentPlanDto, teacherId: string) {
    return this.prisma.paymentPlan.create({
      data: {
        recurrence: createPaymentPlanDto.recurrence,
        amount: createPaymentPlanDto.amount,
        startDate: new Date(createPaymentPlanDto.startDate),
        teacherId,
        isActive: true,
      },
    });
  }

  async findAll(teacherId: string) {
    return this.prisma.paymentPlan.findMany({
      where: { teacherId },
      orderBy: { createdAt: 'desc' },
      include: { payments: true },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.paymentPlan.findUnique({
      where: { id },
      include: { payments: true },
    });
    if (!plan) throw new NotFoundException(`Plano de pagamento com id ${id} não encontrado.`);
    return plan;
  }

  async update(id: string, updatePaymentPlanDto: UpdatePaymentPlanDto) {
    // Verifique se o plano existe
    await this.findOne(id);
    return this.prisma.paymentPlan.update({
      where: { id },
      data: {
        recurrence: updatePaymentPlanDto.recurrence,
        amount: updatePaymentPlanDto.amount,
        startDate: updatePaymentPlanDto.startDate ? new Date(updatePaymentPlanDto.startDate) : undefined,
        isActive: updatePaymentPlanDto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.paymentPlan.delete({
      where: { id },
    });
  }
}
