import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from '../guards/jwt_auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginDto } from '../dtos/login.dto';
import { Role } from '@prisma/client';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as httpMocks from 'node-mocks-http';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      registerUser: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      revokeAllTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto: RegisterUserDto = {
        email: 'a@b.com',
        password: '123',
        name: 'Leo',
        role: Role.TEACHER,
      };
      const user = { id: 'user-1', ...dto, tokenVersion: 0 };
      mockAuthService.registerUser.mockResolvedValue(user);

      const result = await controller.register(dto);

      expect(result).toEqual(user);
      expect(mockAuthService.registerUser).toBeCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login and set cookie', async () => {
      const loginDto: LoginDto = { email: 'a@b.com', password: '123' };
      const tokens = { access_token: 'access', refresh_token: 'refresh' };

      mockAuthService.login.mockResolvedValue(tokens);

      // Mock de response Express
      const res: any = {
        cookie: jest.fn(),
        json: jest.fn().mockReturnValue({ access_token: 'access' }),
      };

      await controller.login(loginDto, 'UA-test', 'IP-test', res);

      expect(mockAuthService.login).toBeCalledWith({
        ...loginDto,
        userAgent: 'UA-test',
        ipAddress: 'IP-test',
      });

      expect(res.cookie).toBeCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({
          httpOnly: true,
          secure: false, // mock NODE_ENV
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        }),
      );
      expect(res.json).toBeCalledWith({ access_token: 'access' });
    });
  });

  describe('refresh', () => {
    it('should refresh tokens when cookies and headers are present', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: {
          'user-agent': 'Navegador do Leo',
          'x-forwarded-for': '123.123.123.123',
        },
        ip: '1.2.3.4',
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        'refresh',
        'Navegador do Leo',
        '123.123.123.123',
      );
    });

    it('should use default userAgent if header missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: {},
        ip: '1.2.3.4',
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        'refresh',
        'Unknown Browser',
        '1.2.3.4',
      );
    });

    it('should use req.ip if x-forwarded-for is missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: { 'user-agent': 'Mozilla' },
        ip: '1.2.3.4',
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        'refresh',
        'Mozilla',
        '1.2.3.4',
      );
    });

    it('should use Unknown IP if ip and x-forwarded-for are missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: { 'user-agent': 'Mozilla' },
        // ip: undefined
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        'refresh',
        'Mozilla',
        'Unknown IP',
      );
    });

    it('should handle missing cookies gracefully', async () => {
      const req: any = {
        cookies: undefined,
        headers: { 'user-agent': 'Mozilla' },
        ip: '1.2.3.4',
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        undefined,
        'Mozilla',
        '1.2.3.4',
      );
    });

    it('should use Unknown IP if x-forwarded-for and req.ip are missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: { 'user-agent': 'Mozilla' },
        ip: undefined,
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        'refresh',
        'Mozilla',
        'Unknown IP',
      );
    });

    it('should handle missing headers object', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        // headers: undefined
        ip: '1.2.3.4',
      };
      await controller.refresh(req);
      expect(mockAuthService.refreshToken).toBeCalledWith(
        'refresh',
        'Unknown Browser',
        '1.2.3.4',
      );
    });
  });

  describe('getProfile', () => {
    it('should return user from request', async () => {
      const req = { user: { id: '123', email: 'a@b.com' } };
      const result = await controller.getProfile(req);
      expect(result).toEqual(req.user);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: { 'user-agent': 'UA-test' },
        ip: 'IP-test',
      };
      mockAuthService.logout.mockResolvedValue({ message: 'ok' });

      const result = await controller.logout(req);

      expect(mockAuthService.logout).toBeCalledWith(
        'refresh',
        'UA-test',
        'IP-test',
      );
      expect(result).toEqual({ message: 'ok' });
    });

    it('should use Unknown Browser if user-agent header is missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: {},
        ip: '123.123.123.123',
      };
      mockAuthService.logout.mockResolvedValue({ message: 'ok' });

      await controller.logout(req);

      expect(mockAuthService.logout).toBeCalledWith(
        'refresh',
        'Unknown Browser',
        '123.123.123.123',
      );
    });

    it('should use req.ip if x-forwarded-for is missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: { 'user-agent': 'Mozilla' },
        ip: '123.123.123.123',
      };
      mockAuthService.logout.mockResolvedValue({ message: 'ok' });

      await controller.logout(req);

      expect(mockAuthService.logout).toBeCalledWith(
        'refresh',
        'Mozilla',
        '123.123.123.123',
      );
    });

    it('should use Unknown IP if x-forwarded-for and req.ip are missing', async () => {
      const req: any = {
        cookies: { refresh_token: 'refresh' },
        headers: { 'user-agent': 'Mozilla' },
        ip: undefined,
      };
      mockAuthService.logout.mockResolvedValue({ message: 'ok' });

      await controller.logout(req);

      expect(mockAuthService.logout).toBeCalledWith(
        'refresh',
        'Mozilla',
        'Unknown IP',
      );
    });
  });

  describe('revokeAllTokens', () => {
    it('should revoke all tokens for user', async () => {
      const req: any = { user: { userId: 'user-1' } };
      mockAuthService.revokeAllTokens.mockResolvedValue(undefined);

      const result = await controller.revokeAllTokens(req);

      expect(mockAuthService.revokeAllTokens).toBeCalledWith('user-1');
      expect(result).toEqual({
        message: 'Todos os tokens foram revogados com sucesso.',
      });
    });
  });
});
