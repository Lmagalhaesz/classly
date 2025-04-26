import { Level } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsNotEmpty({ message: 'O nome da turma é obrigatório.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string.' })
  description?: string;

  @IsNotEmpty({ message: 'O nível é obrigatório.' })
  @IsEnum(Level, { message: `O nível deve ser um dos: ${Object.values(Level).join(', ')}.` })
  level?: Level;
}
