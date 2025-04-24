import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role, Level } from '@prisma/client';
import { CreateUserDto } from './create-user.dto';

/**
 * DTO utilizado para atualizar dados do usuário.
 * Todos os campos são opcionais, mas seguem as mesmas validações do DTO de criação.
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {
  
  /**
   * Novo nome do usuário (opcional).
   */
  @ApiPropertyOptional({ description: 'Nome atualizado do usuário' })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string.' })
  name?: string;

  /**
   * Novo e-mail do usuário (opcional).
   */
  @ApiPropertyOptional({ description: 'Email atualizado do usuário' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido.' })
  email?: string;

  /**
   * Nova senha de acesso (opcional).
   */
  @ApiPropertyOptional({ description: 'Senha atualizada do usuário' })
  @IsOptional()
  @IsString({ message: 'A senha deve ser uma string.' })
  password?: string;

  /**
   * Tipo de perfil atualizado (STUDENT, TEACHER, ADMIN).
   */
  @ApiPropertyOptional({ enum: Role, description: 'Role atualizado do usuário' })
  @IsOptional()
  @IsEnum(Role, { message: `O role deve ser um dos: ${Object.values(Role).join(', ')}.` })
  role?: Role;

  /**
   * Nível de conhecimento (atualização, se for STUDENT).
   */
  @ApiPropertyOptional({ enum: Level, description: 'Nível atualizado, se aplicável para alunos.' })
  @IsOptional()
  @IsEnum(Level, { message: `O nível deve ser um dos: ${Object.values(Level).join(', ')}.` })
  level?: Level;

  /**
   * Atualização da turma vinculada ao aluno (opcional).
   */
  @ApiPropertyOptional({ description: 'groupId atualizado, se o usuário pertencer a um grupo' })
  @IsOptional()
  @IsString({ message: 'groupId deve ser uma string.' })
  groupId?: string;
}
