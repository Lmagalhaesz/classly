import { IsOptional, IsString } from 'class-validator';

export class UpdatePlaylistDto {
  @IsOptional()
  @IsString({ message: 'O título deve ser uma string.' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string.' })
  description?: string;
}