// src/payment-plan/dtos/create-payment-plan.dto.ts
import { IsNotEmpty, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { RecurrenceType } from '@prisma/client';

export class CreatePaymentPlanDto {
  @IsNotEmpty({ message: 'A recorrência é obrigatória.' })
  @IsEnum(RecurrenceType, { message: `A recorrência deve ser um dos: ${Object.values(RecurrenceType).join(', ')}` })
  recurrence: RecurrenceType;

  @IsNotEmpty({ message: 'O valor (amount) é obrigatório.' })
  @IsNumber()
  amount: number;

  @IsNotEmpty({ message: 'A data de início (startDate) é obrigatória.' })
  @IsDateString()
  startDate: string;
}
