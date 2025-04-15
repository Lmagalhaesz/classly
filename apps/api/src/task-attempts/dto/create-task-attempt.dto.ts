import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateTaskAttemptDto {
  @IsNotEmpty({ message: 'O ID da atividade é obrigatório.' })
  @IsString()
  activityId: string;

  @IsNotEmpty({ message: 'O número de acertos é obrigatório.' })
  @IsNumber()
  correctAnswers: number;

  @IsNotEmpty({ message: 'O número de erros é obrigatório.' })
  @IsNumber()
  incorrectAnswers: number;

  // Pontuação opcional, se você estiver atribuindo uma pontuação
  @IsOptional()
  @IsNumber()
  score?: number;

  // Você pode permitir que o cliente envie os timestamps de início e término,
  // ou deixar que o backend os registre. Aqui, permitimos opcionalmente:
  @IsOptional()
  @IsDateString({}, { message: 'startedAt deve estar no formato ISO8601.' })
  startedAt?: string;

  @IsOptional()
  @IsDateString({}, { message: 'finishedAt deve estar no formato ISO8601.' })
  finishedAt?: string;
}