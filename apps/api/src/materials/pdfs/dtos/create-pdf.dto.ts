import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { Level } from '@prisma/client';

export class CreatePdfMaterialDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  playlistId?: string;

  @IsNotEmpty()
  @IsEnum(Level)
  level: Level;
}
