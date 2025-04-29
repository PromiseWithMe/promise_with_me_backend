import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterRequest } from '../dto/request/register.request';
import { LoginRequest } from '../dto/request/login.reqeust';
import { TokensResponse } from '../dto/response/tokens.response';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    reIssue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with the provided request and return the result', async () => {
      // Arrange
      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testUser',
      };
      const expectedResult = new TokensResponse('access-token', 'refresh-token');
      
      mockAuthService.register.mockResolvedValue(expectedResult);

      // Act
      const result = await authController.register(registerRequest);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(registerRequest);
      expect(result).toBe(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with the provided request and return the result', async () => {
      // Arrange
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedResult = new TokensResponse('access-token', 'refresh-token');
      
      mockAuthService.login.mockResolvedValue(expectedResult);

      // Act
      const result = await authController.login(loginRequest);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginRequest);
      expect(result).toBe(expectedResult);
    });
  });

  describe('reissue', () => {
    it('should call authService.reIssue with the provided userEmail and return the result', async () => {
      // Arrange
      const userEmail = 'test@example.com';
      const expectedResult = new TokensResponse('new-access-token', 'new-refresh-token');
      
      mockAuthService.reIssue.mockResolvedValue(expectedResult);

      // Act
      const result = await authController.reissue(userEmail);

      // Assert
      expect(authService.reIssue).toHaveBeenCalledWith(userEmail);
      expect(result).toBe(expectedResult);
    });
  });
});
