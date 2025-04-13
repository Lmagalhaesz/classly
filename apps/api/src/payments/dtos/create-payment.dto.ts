import { IsNotEmpty, IsNumber, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
    
  @IsNotEmpty({ message: 'O ID do aluno é obrigatório.' })
  @IsString()
  studentId: string;

  @IsNotEmpty({ message: 'O ID do professor é obrigatório.' })
  @IsString()
  teacherId: string;

  @IsNotEmpty({ message: 'O valor (amount) é obrigatório.' })
  @IsNumber()
  amount: number;

  @IsNotEmpty({ message: 'A data de vencimento (dueDate) é obrigatória.' })
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsNotEmpty({ message: 'O status do pagamento é obrigatório.' })
  @IsEnum(PaymentStatus, { message: `O status deve ser um dos: ${Object.values(PaymentStatus).join(', ')}` })
  status: PaymentStatus;
}
