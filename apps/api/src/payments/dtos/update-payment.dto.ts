import { IsOptional, IsNumber, IsDateString, IsEnum, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: `O status deve ser um dos: ${Object.values(PaymentStatus).join(', ')}` })
  status?: PaymentStatus;
  
  @IsOptional()
  @IsString()
  studentId?: string;
}
