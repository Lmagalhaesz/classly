import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { getLoggerToken } from 'nestjs-pino';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let mockUser;

  const mockUserService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    getUserById: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mocked-access-token'),
    sign: jest.fn((payload, options) => {
      if (options && options.expiresIn === '15m') return 'mocked-access-token';
      if (options && options.expiresIn === '7d') return 'mocked-refresh-token';
      return 'mocked-token';
    }),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock_secret'),
  };

  const mockRedisService = {
    client: {
      hmset: jest.fn(),
      expire: jest.fn(),
      hgetall: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    },
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: await bcrypt.hash('password', 10),
      name: 'Test User',
      role: Role.TEACHER,
      tokenVersion: 0,
    };
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: getLoggerToken(AuthService.name),
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // LOGIN
  it('should login successfully', async () => {
    mockUserService.findByEmail.mockResolvedValue(mockUser);

    const loginDto = {
      email: mockUser.email,
      password: 'password',
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    };

    const result = await service.login(loginDto);

    expect(result).toHaveProperty('access_token', 'mocked-access-token');
    expect(result).toHaveProperty('refresh_token', 'mocked-refresh-token');
  });

  it('should throw UnauthorizedException for invalid password', async () => {
    mockUserService.findByEmail.mockResolvedValue(mockUser);

    const loginDto = {
      email: mockUser.email,
      password: 'wrong_password',
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    };

    await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    mockUserService.findByEmail.mockResolvedValue(null);

    const loginDto = {
      email: 'notfound@classly.com',
      password: 'senha123',
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    };

    await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    expect(mockLogger.warn).toHaveBeenCalledWith({ email: loginDto.email }, expect.any(String));
  });

  // CREATE REFRESH TOKEN
  it('should create a refresh token', async () => {
    const result = await service.createRefreshToken(
      mockUser.id,
      'Jest',
      '127.0.0.1',
    );
    expect(result).toBe('mocked-refresh-token');
  });

  it('should throw if JWT_REFRESH_SECRET is not set in createRefreshToken', async () => {
    mockConfigService.get.mockImplementation((key) => {
      if (key === 'JWT_REFRESH_SECRET') return undefined;
      return 'mock_secret';
    });
    await expect(
      service.createRefreshToken(mockUser.id, 'Jest', '127.0.0.1'),
    ).rejects.toThrow('JWT_REFRESH_SECRET não configurado.');
  });

  // REGISTER USER
  describe('registerUser', () => {
    const registerDto = {
      email: 'newuser@classly.com',
      password: 'pass123',
      name: 'Novo Usuário',
      role: Role.TEACHER,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve registrar usuário com email inédito', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockResolvedValue({
        id: 'new-id',
        ...registerDto,
        tokenVersion: 0,
      });

      const result = await service.registerUser(registerDto);

      expect(result).toMatchObject({
        id: 'new-id',
        email: registerDto.email,
        name: registerDto.name,
        role: registerDto.role,
        tokenVersion: 0,
      });
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUserService.createUser).toHaveBeenCalledWith(registerDto);
      expect(mockLogger.info).toHaveBeenCalledWith({ userId: 'new-id' }, expect.any(String));
    });

    it('deve lançar ConflictException se email já cadastrado', async () => {
      mockUserService.findByEmail.mockResolvedValue({ id: 'existing', ...registerDto });

      await expect(service.registerUser(registerDto)).rejects.toThrow(ConflictException);
      expect(mockLogger.warn).toHaveBeenCalledWith({ email: registerDto.email }, expect.any(String));
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });
  });

  // REFRESH TOKEN
  it('should throw UnauthorizedException if refreshToken not provided in refreshToken', async () => {
    await expect(service.refreshToken('', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if session not found for refreshToken', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({});
    await expect(service.refreshToken('token', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if session has different userAgent or ipAddress', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({
      userId: mockUser.id,
      userAgent: 'Outro Navegador',
      ipAddress: '999.999.999.999',
    });
    await expect(service.refreshToken('token', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user not found in refreshToken', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({
      userId: mockUser.id,
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    });
    mockRedisService.client.del.mockResolvedValue(1);
    mockUserService.getUserById.mockResolvedValue(null);
    await expect(service.refreshToken('token', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should refresh token successfully', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({
      userId: mockUser.id,
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    });
    mockRedisService.client.del.mockResolvedValue(1);
    mockUserService.getUserById.mockResolvedValue(mockUser);

    const result = await service.refreshToken('token', 'Jest', '127.0.0.1');
    expect(result).toHaveProperty('access_token', 'mocked-access-token');
    expect(result).toHaveProperty('refresh_token', 'mocked-refresh-token');
  });

  // LOGOUT
  it('should throw UnauthorizedException if logout with invalid token', async () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    mockConfigService.get.mockReturnValue('mock_secret');

    await expect(service.logout('token', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if logout with non-existent session', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({});
    await expect(service.logout('token', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if logout with wrong device/IP', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({
      userId: mockUser.id,
      userAgent: 'Outro Navegador',
      ipAddress: '999.999.999.999',
    });
    await expect(service.logout('token', 'Jest', '127.0.0.1')).rejects.toThrow(UnauthorizedException);
  });

  it('should logout successfully', async () => {
    mockJwtService.verify.mockReturnValue({ jti: 'session-jti' });
    mockConfigService.get.mockReturnValue('mock_secret');
    mockRedisService.client.hgetall.mockResolvedValue({
      userId: mockUser.id,
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    });
    mockRedisService.client.del.mockResolvedValue(1);

    const result = await service.logout('token', 'Jest', '127.0.0.1');
    expect(result).toEqual({ message: 'Logout realizado com sucesso.' });
  });

  // SESSÕES
  it('should list all user sessions', async () => {
    mockRedisService.client.keys.mockResolvedValue(['session:1', 'session:2']);
    mockRedisService.client.hgetall
      .mockResolvedValueOnce({
        userId: mockUser.id,
        userAgent: 'Jest',
        ipAddress: '127.0.0.1',
        createdAt: 'data',
      })
      .mockResolvedValueOnce({
        userId: 'outra',
        userAgent: 'Outro',
        ipAddress: 'Outro',
        createdAt: 'outra-data',
      });

    const sessions = await service.getUserSessions(mockUser.id);
    expect(sessions.length).toBe(1);
    expect(sessions[0].userAgent).toBe('Jest');
  });

  // REVOGAR SESSÃO ESPECÍFICA
  it('should revoke session successfully', async () => {
    mockRedisService.client.hgetall.mockResolvedValue({
      userId: mockUser.id,
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    });
    mockRedisService.client.del.mockResolvedValue(1);

    const result = await service.revokeSession(mockUser.id, 'session:1');
    expect(result).toEqual({ message: 'Sessão revogada com sucesso.' });
  });

  it('should throw UnauthorizedException if revokeSession not found or unauthorized', async () => {
    mockRedisService.client.hgetall.mockResolvedValue({});
    await expect(service.revokeSession(mockUser.id, 'session:1')).rejects.toThrow(UnauthorizedException);

    mockRedisService.client.hgetall.mockResolvedValue({ userId: 'outro' });
    await expect(service.revokeSession(mockUser.id, 'session:1')).rejects.toThrow(UnauthorizedException);
  });

  // REVOGAR TODAS AS SESSÕES
  it('should revoke all user sessions', async () => {
    mockRedisService.client.keys.mockResolvedValue(['session:1', 'session:2']);
    mockRedisService.client.hgetall
      .mockResolvedValueOnce({ userId: mockUser.id })
      .mockResolvedValueOnce({ userId: 'outra' });
    mockRedisService.client.del.mockResolvedValue(1);

    const result = await service.revokeAllSessions(mockUser.id);
    expect(result.message).toContain('1 sessões revogadas');
  });

  // REVOGAR TOKENS (tokenVersion)
  it('should revoke all tokens by incrementing tokenVersion', async () => {
    mockPrismaService.user.update.mockResolvedValue({});
    await service.revokeAllTokens(mockUser.id);
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { tokenVersion: { increment: 1 } },
    });
  });

  it('should login successfully with default userAgent and ipAddress', async () => {
    mockUserService.findByEmail.mockResolvedValue(mockUser);
  
    // Simula loginDto sem userAgent e ipAddress
    const loginDto = {
      email: mockUser.email,
      password: 'password',
      // userAgent e ipAddress ausentes
    };
  
    const result = await service.login(loginDto as any);
  
    expect(result).toHaveProperty('access_token', 'mocked-access-token');
    expect(result).toHaveProperty('refresh_token', 'mocked-refresh-token');
    // Verifica se salvou no Redis, que é o fluxo mais comum
    expect(mockRedisService.client.hmset).toBeCalled();
  });
  

  it('should throw UnauthorizedException if logout is called without refreshToken', async () => {
    await expect(
      service.logout(undefined as any, 'Jest', '127.0.0.1'),
    ).rejects.toThrow('Refresh token não fornecido.');
  });  
});
