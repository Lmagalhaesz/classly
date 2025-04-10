import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido.' })
  email: string;

  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  password: string;

  @IsOptional()
  userAgent?: any;

  @IsOptional()
  ipAddress?: any;
}
