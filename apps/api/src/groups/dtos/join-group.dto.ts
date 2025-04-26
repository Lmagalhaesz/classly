import { IsNotEmpty, IsString } from 'class-validator';

export class JoinGroupDto {

  @IsNotEmpty({ message: 'O código do convite é obrigatório.' })
  @IsString()
  inviteCode: string;
}
