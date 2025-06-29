import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Level } from '@prisma/client';

export class UpdatePdfMaterialDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  playlistId?: string;

  @IsOptional()
  @IsEnum(Level)
  level?: Level;
}
