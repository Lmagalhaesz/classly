import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { JwtAuthGuard } from './guards/jwt_auth.guard';
import { Request as ExpressRequest, Response } from 'express';
import { Ip } from 'src/common/decorators/ip.decorator';
import { UserAgent } from 'src/common/decorators/user-agent.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autentica o usuário e retorna tokens JWT' })
  @ApiResponse({
    status: 200,
    description:
      'Login bem-sucedido. Retorna access token no body e refresh token no cookie.',
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  async login(
    @Body() loginDto: LoginDto,
    @UserAgent() userAgent: string,
    @Ip() ipAddress: string,
    @Res() res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login({
      ...loginDto,
      userAgent,
      ipAddress,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });

    return res.json({ access_token });
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Gera um novo par de tokens baseado no refresh token',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso.' })
  @ApiResponse({
    status: 401,
    description:
      'Token inválido, expirado ou utilizado em dispositivo não autorizado.',
  })
  async refresh(@Req() req: ExpressRequest) {
    const refreshToken = req.cookies?.refresh_token;
    const userAgent = req.headers?.['user-agent'] || 'Unknown Browser';
    const ipAddress =
      (req.headers?.['x-forwarded-for'] as string) || req.ip || 'Unknown IP';
    return this.authService.refreshToken(refreshToken, userAgent, ipAddress);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Usuário autenticado.' })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Realiza logout e invalida o refresh token da sessão atual',
  })
  @ApiResponse({ status: 200, description: 'Logout bem-sucedido.' })
  @ApiResponse({
    status: 401,
    description:
      'Refresh token inválido, expirado ou em uso fora do dispositivo/IP original.',
  })
  async logout(@Req() req: ExpressRequest) {
    const refreshToken = req.cookies?.refresh_token;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';

    return this.authService.logout(refreshToken, userAgent, ipAddress);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoga todos os access tokens do usuário, forçando novo login',
  })
  @ApiResponse({
    status: 200,
    description: 'Todos os tokens foram revogados com sucesso.',
  })
  async revokeAllTokens(@Req() req) {
    const userId = req.user.userId;
    await this.authService.revokeAllTokens(userId);
    return { message: 'Todos os tokens foram revogados com sucesso.' };
  }
}
