import { AuthService } from '../auth.service';
import { UserRepository } from '../../repositories/user.repository';
import { ConflictError, UnauthorizedError } from '../../utils/errors';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('../../repositories/user.repository');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    mockUserRepository = authService['userRepository'] as jest.Mocked<UserRepository>;
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUserRepository.create.mockResolvedValue({
        id: 'user-123',
        email: mockRegisterData.email,
        name: mockRegisterData.name,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await authService.register(mockRegisterData);

      expect(result.user.email).toBe(mockRegisterData.email);
      expect(result.token).toBeDefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(mockRegisterData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockRegisterData.password, 10);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictError when user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: mockRegisterData.email,
        name: 'Existing User',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(authService.register(mockRegisterData)).rejects.toThrow(ConflictError);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user-123',
      email: mockLoginData.email,
      name: 'Test User',
      password: 'hashed-password',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should login user with correct credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(mockLoginData);

      expect(result.user.email).toBe(mockLoginData.email);
      expect(result.token).toBeDefined();
      expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginData.password, mockUser.password);
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(mockLoginData)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(mockLoginData)).rejects.toThrow(UnauthorizedError);
    });
  });
});

