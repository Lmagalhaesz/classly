import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Level, Role } from '@prisma/client';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email é obrigatório.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória.' })
  @IsString()
  password: string;

  @IsEnum(Role, { message: `O role deve ser um dos: ${Object.values(Role).join(', ')}` })
  role: Role;

  @IsOptional()
  @IsEnum(Level, { message: `O level deve ser um dos: ${Object.values(Level).join(', ')}` })
  level?: Level;

  @IsOptional()
  @IsString({ message: 'Erro ao vincular turma.' })
  groupId?: string;
}
