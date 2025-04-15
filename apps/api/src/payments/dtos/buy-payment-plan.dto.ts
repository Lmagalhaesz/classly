import { IsNotEmpty, IsString } from 'class-validator';

export class BuyPaymentPlanDto {
  @IsNotEmpty({ message: 'O ID do plano de pagamento é obrigatório.' })
  @IsString()
  paymentPlanId: string;
}
