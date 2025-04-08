import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role, Level } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Nome atualizado do usuário' })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string.' })
  name?: string;

  @ApiPropertyOptional({ description: 'Email atualizado do usuário' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  email?: string;

  @ApiPropertyOptional({ description: 'Senha atualizada do usuário' })
  @IsOptional()
  @IsString({ message: 'A senha deve ser uma string.' })
  password?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Role atualizado do usuário' })
  @IsOptional()
  @IsEnum(Role, { message: `O role deve ser um dos: ${Object.values(Role).join(', ')}.` })
  role?: Role;

  @ApiPropertyOptional({ enum: Level, description: 'Nível atualizado, se aplicável, para alunos.' })
  @IsOptional()
  @IsEnum(Level, { message: `O nível deve ser um dos: ${Object.values(Level).join(', ')}.` })
  level?: Level;

  @ApiPropertyOptional({ description: 'groupId, se o usuário pertencer a um grupo' })
  @IsOptional()
  @IsString({ message: 'groupId deve ser uma string.' })
  groupId?: string;
}
