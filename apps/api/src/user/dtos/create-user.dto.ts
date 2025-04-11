import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Role, Level } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @IsString({ message: 'O nome deve ser uma string.' })
  name: string;

  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @IsString({ message: 'A senha deve ser uma string.' })
  password: string;

  @IsEnum(Role, { message: `O role deve ser um dos: ${Object.values(Role).join(', ')}.` })
  role: Role;

  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsOptional()
  @IsEnum(Level, { message: `O nível deve ser um dos: ${Object.values(Level).join(', ')}.` })
  level?: Level;

  @IsOptional()
  @IsString({ message: 'groupId deve ser uma string.' })
  groupId?: string;
}
