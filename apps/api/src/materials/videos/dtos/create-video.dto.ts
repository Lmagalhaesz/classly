import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUrl } from 'class-validator';
import { Level } from '@prisma/client';

export class CreateVideoDto {
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'A URL do vídeo é obrigatória.' })
  @IsString()
  @IsUrl({}, { message: 'A URL deve ser válida.' })
  url: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'playlistId deve ser uma string.' })
  playlistId?: string;

  @IsNotEmpty({ message: 'O level é obrigatório.' })
  @IsEnum(Level, { message: `O level deve ser um dos: ${Object.values(Level).join(', ')}` })
  level: Level;
}
