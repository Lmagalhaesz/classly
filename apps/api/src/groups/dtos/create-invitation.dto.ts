import { IsOptional, IsDateString } from 'class-validator';

export class CreateGroupInvitationDto {

  @IsOptional()
  @IsDateString({}, { message: 'expiresAt deve estar no formato ISO 8601.' })
  expiresAt?: string;
  
}
