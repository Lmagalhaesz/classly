import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Role, Level } from '@prisma/client';

/**
 * DTO utilizado para criação de um novo usuário (aluno, professor ou admin).
 * Valida os dados de entrada de acordo com as regras de negócio e o schema do Prisma.
 */
export class CreateUserDto {
  /**
   * Nome completo do usuário.
   * Obrigatório para todos os perfis.
   */
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @IsString({ message: 'O nome deve ser uma string.' })
  name: string;

  /**
   * Endereço de e-mail do usuário.
   * Obrigatório e validado como e-mail válido.
   */
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  /**
   * Senha de acesso à plataforma.
   * Obrigatória para todos os perfis.
   */
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @IsString({ message: 'A senha deve ser uma string.' })
  password: string;

  /**
   * Tipo de perfil do usuário (STUDENT, TEACHER, ADMIN).
   * Obrigatório e validado com base no enum do Prisma.
   */
  @IsEnum(Role, { message: `O role deve ser um dos: ${Object.values(Role).join(', ')}.` })
  role: Role;

  /**
   * Nível de conhecimento (apenas se for STUDENT).
   * Opcional e validado como enum Level.
   */
  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsEnum(Level, { message: `O nível deve ser um dos: ${Object.values(Level).join(', ')}.` })
  level?: Level;

  /**
   * ID da turma em que o aluno será inserido (caso seja STUDENT).
   * Opcional, usado para vinculação automática ao grupo.
   */
  @ValidateIf((o) => o.role === Role.STUDENT)
  @IsString({ message: 'groupId deve ser uma string.' })
  @IsOptional()
  groupId?: string;
}
