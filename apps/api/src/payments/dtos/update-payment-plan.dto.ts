// src/payment-plan/dtos/update-payment-plan.dto.ts
import { IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { RecurrenceType } from '@prisma/client';

export class UpdatePaymentPlanDto {
  @IsOptional()
  @IsEnum(RecurrenceType, { message: `A recorrência deve ser um dos: ${Object.values(RecurrenceType).join(', ')}` })
  recurrence?: RecurrenceType;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @IsOptional()
  isActive?: boolean;
}
