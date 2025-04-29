import { Test, TestingModule } from '@nestjs/testing';
import { PromiseService } from '../promise.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Promise } from '../entity/promise.entity';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { CreatePromiseRequest } from '../dto/request/create-promise.request';
import { UserNotFoundException } from 'src/exception/custom-exception/user-not-found.exception';
import { GetPromsiesRequest } from '../dto/request/get-promises.request';
import { GetPromiseBodyRequest } from '../dto/request/get-promise-body.request';
import { UpdatePromiseRequest } from '../dto/request/update-promise.request';
import { PromiseNotFoundException } from 'src/exception/custom-exception/promise-not-found.exception';
import { ServerException } from 'src/exception/custom-exception/server.exception';
import { PromiseState } from 'src/common/enum/promise-state';
import { ChangePromiseStateRequest } from '../dto/request/change-promise-state.request';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('PromiseService', () => {
  let service: PromiseService;
  let promiseRepository: MockRepository<Promise>;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromiseService,
        {
          provide: getRepositoryToken(Promise),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<PromiseService>(PromiseService);
    promiseRepository = module.get<MockRepository<Promise>>(
      getRepositoryToken(Promise),
    );
    userRepository = module.get<MockRepository<User>>(
      getRepositoryToken(User),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPromise', () => {
    it('should create a promise successfully', async () => {
      const userEmail = 'test@example.com';
      const createPromiseRequest: CreatePromiseRequest = {
        title: 'Test Promise',
        dayOfWeek: ['mon', 'wed', 'fri'],
      };
      const mockUser = { id: 1, email: userEmail };
      
      userRepository.findOne.mockResolvedValue(mockUser);
      promiseRepository.save.mockResolvedValue(true);

      const result = await service.createPromise(
        userEmail,
        createPromiseRequest,
      );

      expect(result).toBe(true);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: userEmail },
      });
      expect(promiseRepository.save).toHaveBeenCalledWith({
        title: createPromiseRequest.title,
        dayOfWeek: createPromiseRequest.dayOfWeek.join(','),
        user: mockUser,
      });
    });

    it('should throw UserNotFoundException when user is not found', async () => {
      const userEmail = 'nonexistent@example.com';
      const createPromiseRequest: CreatePromiseRequest = {
        title: 'Test Promise',
        dayOfWeek: ['mon', 'wed', 'fri'],
      };
      
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createPromise(userEmail, createPromiseRequest),
      ).rejects.toThrow(UserNotFoundException);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: userEmail },
      });
      expect(promiseRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getPromises', () => {
    it('should return promises successfully', async () => {
      const userEmail = 'test@example.com';
      const getPromsiesRequest: GetPromsiesRequest = { page: 0 };
      const getPromiseBodyRequest: GetPromiseBodyRequest = {
        dayOfWeek: ['mon'],
      };
      
      const mockPromises = [
        {
          id: '1',
          title: 'Test Promise',
          dayOfWeek: 'mon,wed,fri',
          promiseState: PromiseState.NotCompleted,
          createdAt: new Date(),
        },
      ];
      
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockPromises),
      };
      
      promiseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getPromises(
        userEmail,
        getPromsiesRequest,
        getPromiseBodyRequest,
      );

      expect(result.promises).toHaveLength(1);
      expect(promiseRepository.createQueryBuilder).toHaveBeenCalledWith('p');
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'p.userEmail = :userEmail',
        { userEmail },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('p.createdAt', 'DESC');
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });

    it('should throw ServerException when query fails', async () => {
      const userEmail = 'test@example.com';
      const getPromsiesRequest: GetPromsiesRequest = { page: 0 };
      const getPromiseBodyRequest: GetPromiseBodyRequest = { dayOfWeek: ['mon'] };
      
      const mockQueryBuilder = {
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      
      promiseRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(
        service.getPromises(userEmail, getPromsiesRequest, getPromiseBodyRequest),
      ).rejects.toThrow(ServerException);
    });
  });

  describe('updatePromise', () => {
    it('should update a promise successfully', async () => {
      const promiseId = 'test-uuid';
      const userEmail = 'test@example.com';
      const updatePromiseRequest: UpdatePromiseRequest = {
        title: 'Updated Promise',
        dayOfWeek: ['tue', 'thu'],
      };
      
      promiseRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updatePromise(
        promiseId,
        userEmail,
        updatePromiseRequest,
      );

      expect(result).toBe(true);
      expect(promiseRepository.update).toHaveBeenCalledWith(
        { id: promiseId, user: { email: userEmail } },
        {
          title: updatePromiseRequest.title,
          dayOfWeek: updatePromiseRequest.dayOfWeek.join(','),
        },
      );
    });

    it('should throw PromiseNotFoundException when promise is not found', async () => {
      const promiseId = 'nonexistent-uuid';
      const userEmail = 'test@example.com';
      const updatePromiseRequest: UpdatePromiseRequest = {
        title: 'Updated Promise',
        dayOfWeek: ['tue', 'thu'],
      };
      
      promiseRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.updatePromise(promiseId, userEmail, updatePromiseRequest),
      ).rejects.toThrow(PromiseNotFoundException);
      expect(promiseRepository.update).toHaveBeenCalled();
    });
  });

  describe('deletePromise', () => {
    it('should delete a promise successfully', async () => {
      const promiseId = 'test-uuid';
      const userEmail = 'test@example.com';
      
      promiseRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deletePromise(promiseId, userEmail);

      expect(result).toBe(true);
      expect(promiseRepository.delete).toHaveBeenCalledWith({
        id: promiseId,
        user: { email: userEmail },
      });
    });

    it('should throw PromiseNotFoundException when promise is not found', async () => {
      const promiseId = 'nonexistent-uuid';
      const userEmail = 'test@example.com';
      
      promiseRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deletePromise(promiseId, userEmail)).rejects.toThrow(
        PromiseNotFoundException,
      );
      expect(promiseRepository.delete).toHaveBeenCalled();
    });
  });

  describe('changePromiseState', () => {
    it('should change promise state successfully', async () => {
      const promiseId = 'test-uuid';
      const userEmail = 'test@example.com';
      const changePromiseStateRequest: ChangePromiseStateRequest = {
        promiseState: 'Completed',
      };
      
      promiseRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.changePromiseState(
        promiseId,
        userEmail,
        changePromiseStateRequest,
      );

      expect(result).toBe(true);
      expect(promiseRepository.update).toHaveBeenCalledWith(
        { id: promiseId, user: { email: userEmail } },
        { promiseState: PromiseState.Completed },
      );
    });

    it('should throw PromiseNotFoundException when promise is not found', async () => {
      const promiseId = 'nonexistent-uuid';
      const userEmail = 'test@example.com';
      const changePromiseStateRequest: ChangePromiseStateRequest = {
        promiseState: 'Completed',
      };
      
      promiseRepository.update.mockResolvedValue({ affected: 0 });

      await expect(
        service.changePromiseState(promiseId, userEmail, changePromiseStateRequest),
      ).rejects.toThrow(PromiseNotFoundException);
      expect(promiseRepository.update).toHaveBeenCalled();
    });
  });
});
