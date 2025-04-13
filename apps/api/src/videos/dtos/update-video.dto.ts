import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { Level } from '@prisma/client';

export class UpdateVideoDto {

  @IsOptional()
  @IsString({ message: 'O título deve ser uma string.' })
  title: string;

  @IsOptional()
  @IsString({ message: 'A url deve ser uma string.' })
  url: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'playlistId deve ser uma string.' })
  playlistId?: string;

  @IsOptional()
  @IsEnum(Level, { message: `O level deve ser um dos: ${Object.values(Level).join(', ')}` })
  level: Level;
}
