import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterRequest } from '../dto/request/register.request';
import { LoginRequest } from '../dto/request/login.reqeust';
import * as bcrypt from 'bcrypt';
import { TokensResponse } from '../dto/response/tokens.response';
import Redis from 'ioredis';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';
import { UserAlreadyExistsException } from 'src/exception/custom-exception/user-already-exists.exception.ts';
import { LoginFailException } from 'src/exception/custom-exception/login-fail.exception';
import { EnvKeys } from 'src/common/enum/env-keys';
import { User } from '../../user/entity/user.entity'
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let redisClient: Redis;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRedisClient = {
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRedisConnectionToken(),
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    redisClient = module.get<Redis>(getRedisConnectionToken());

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('_generateToken', () => {
    it('should generate access and refresh tokens', async () => {
      const email = 'test@example.com';
      const accessToken = 'test-access-token';
      const refreshToken = 'test-refresh-token';
      
      mockJwtService.signAsync.mockImplementation((payload, options) => {
        if (options.expiresIn === '10h') return Promise.resolve(accessToken);
        if (options.expiresIn === '7d') return Promise.resolve(refreshToken);
        return Promise.resolve('');
      });
      
      mockConfigService.get.mockImplementation((key) => {
        if (key === EnvKeys.JWT_SECRET) return 'test-secret';
        if (key === EnvKeys.JWT_SECRET_REFRESH) return 'test-refresh-secret';
        return '';
      });

      const result = await authService['_generateToken'](email);

      expect(result).toBeInstanceOf(TokensResponse);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(redisClient.set).toHaveBeenCalledWith(
        `${email}_refresh`,
        refreshToken,
        'EX',
        60 * 60 * 24 * 7
      );
    });
  });

  describe('register', () => {
    it('should throw UserAlreadyExistsException if user already exists', async () => {
      const registerRequest: RegisterRequest = {
        email: 'existing@example.com',
        password: 'password123',
        nickname: 'existingUser',
      };

      mockUserRepository.findOne.mockResolvedValue({ email: registerRequest.email });

      await expect(authService.register(registerRequest)).rejects.toThrow(UserAlreadyExistsException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerRequest.email },
        select: ['email'],
      });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should register a new user and return tokens', async () => {
      const registerRequest: RegisterRequest = {
        email: 'new@example.com',
        password: 'password123',
        nickname: 'newUser',
      };
      const hashedPassword = 'hashed-password';
      const accessToken = 'new-access-token';
      const refreshToken = 'new-refresh-token';

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      
      const generateTokenSpy = jest.spyOn(authService as any, '_generateToken')
        .mockResolvedValue(new TokensResponse(accessToken, refreshToken));

      const result = await authService.register(registerRequest);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerRequest.email },
        select: ['email'],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerRequest.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: registerRequest.email,
        password: hashedPassword,
        nickname: registerRequest.nickname,
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(generateTokenSpy).toHaveBeenCalledWith(registerRequest.email);
      expect(result).toBeInstanceOf(TokensResponse);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });
  });

  describe('login', () => {
    it('should throw LoginFailException if user does not exist', async () => {
      const loginRequest: LoginRequest = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(authService.login(loginRequest)).rejects.toThrow(LoginFailException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginRequest.email },
        select: ['email', 'password'],
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw LoginFailException if password is incorrect', async () => {
      const loginRequest: LoginRequest = {
        email: 'user@example.com',
        password: 'wrong-password',
      };
      const user = {
        email: loginRequest.email,
        password: 'hashed-password',
      };

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginRequest)).rejects.toThrow(LoginFailException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginRequest.email },
        select: ['email', 'password'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginRequest.password, user.password);
    });

    it('should login user and return tokens if credentials are valid', async () => {
      const loginRequest: LoginRequest = {
        email: 'valid@example.com',
        password: 'correct-password',
      };
      const user = {
        email: loginRequest.email,
        password: 'hashed-password',
      };
      const accessToken = 'login-access-token';
      const refreshToken = 'login-refresh-token';

      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const generateTokenSpy = jest.spyOn(authService as any, '_generateToken')
        .mockResolvedValue(new TokensResponse(accessToken, refreshToken));

      const result = await authService.login(loginRequest);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginRequest.email },
        select: ['email', 'password'],
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginRequest.password, user.password);
      expect(generateTokenSpy).toHaveBeenCalledWith(loginRequest.email);
      expect(result).toBeInstanceOf(TokensResponse);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });
  });

  describe('reIssue', () => {
    it('should generate new tokens for the user', async () => {
      const userEmail = 'user@example.com';
      const accessToken = 'reissued-access-token';
      const refreshToken = 'reissued-refresh-token';

      const generateTokenSpy = jest.spyOn(authService as any, '_generateToken')
        .mockResolvedValue(new TokensResponse(accessToken, refreshToken));

      const result = await authService.reIssue(userEmail);

      expect(generateTokenSpy).toHaveBeenCalledWith(userEmail);
      expect(result).toBeInstanceOf(TokensResponse);
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
    });
  });
});
