import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Level } from '@prisma/client';

export class CreatePlaylistDto {
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string.' })
  description?: string;

  @IsNotEmpty({ message: 'O level é obrigatório.' })
  @IsEnum(Level, { message: `O level deve ser um dos: ${Object.values(Level).join(', ')}` })
  level: Level;
}
