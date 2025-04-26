import { IsOptional, IsDateString, IsString, IsNotEmpty } from 'class-validator';

export class CreateGroupInvitationDto {

  @IsNotEmpty({ message: 'O campo "expiresAt" é obrigatório.' })
  @IsDateString({}, { message: 'expiresAt deve estar no formato ISO 8601.' })
  expiresAt?: string;
  
  @IsOptional()
  @IsString({ message: 'level deve ser uma string.' })
  level?: string;
}
