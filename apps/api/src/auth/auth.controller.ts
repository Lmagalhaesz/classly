import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterUserDto } from './dtos/register-user.dto';
import { JwtAuthGuard } from './guards/jwt_auth.guard';
import { Request as ExpressRequest, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autentica o usuário e retorna tokens JWT' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: ExpressRequest,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';

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
  async refresh(@Req() req: ExpressRequest) {
    const refreshToken = req.cookies?.refresh_token;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';
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
  async logout(@Req() req: ExpressRequest) {
    const refreshToken = req.cookies?.refresh_token;
    const userAgent = req.headers['user-agent'] || 'Unknown Browser';
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';

    return this.authService.logout(refreshToken, userAgent, ipAddress);
  }
}
