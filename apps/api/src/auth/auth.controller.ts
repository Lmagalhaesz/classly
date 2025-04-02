import { Controller, Post, Body, Request, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt_auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register/user')
  async registerUser(@Body() body) {
    const { email, password,  role, level, groupId } = body;
    return this.authService.registerUser(email, password, role, level, groupId);
  }
  @Post('login')
  async login(@Body() body) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
