import { Test, TestingModule } from '@nestjs/testing';
import { PromiseController } from '../promise.controller';
import { PromiseService } from '../promise.service';
import { CreatePromiseRequest } from '../dto/request/create-promise.request';
import { GetPromsiesRequest } from '../dto/request/get-promises.request';
import { UpdatePromiseRequest } from '../dto/request/update-promise.request';
import { ChangePromiseStateRequest } from '../dto/request/change-promise-state.request';
import { GetPromiseBodyRequest } from '../dto/request/get-promise-body.request';
import { GetPromisesResponse } from '../dto/response/get-promises.response';
import { PromiseState } from 'src/common/enum/promise-state';

describe('PromiseController', () => {
  let controller: PromiseController;
  let service: PromiseService;

  const mockPromiseService = {
    createPromise: jest.fn(),
    getPromises: jest.fn(),
    updatePromise: jest.fn(),
    deletePromise: jest.fn(),
    changePromiseState: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromiseController],
      providers: [
        {
          provide: PromiseService,
          useValue: mockPromiseService,
        },
      ],
    }).compile();

    controller = module.get<PromiseController>(PromiseController);
    service = module.get<PromiseService>(PromiseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a promise', async () => {
      const userEmail = 'test@example.com';
      const createPromiseRequest: CreatePromiseRequest = {
        title: 'Test Promise',
        dayOfWeek: ['mon', 'wed', 'fri'],
      };
      mockPromiseService.createPromise.mockResolvedValue(true);

      const result = await controller.create(userEmail, createPromiseRequest);

      expect(result).toBe(true);
      expect(mockPromiseService.createPromise).toHaveBeenCalledWith(
        userEmail,
        createPromiseRequest,
      );
    });
  });

  describe('findAll', () => {
    it('should return all promises', async () => {
      const userEmail = 'test@example.com';
      const getPromsiesRequest: GetPromsiesRequest = { page: 0 };
      const getPromiseBodyRequest: GetPromiseBodyRequest = {
        dayOfWeek: ['mon'],
      };
      const promisesResponse = new GetPromisesResponse([
        {
          id: '1',
          title: 'Test Promise',
          dayOfWeek: 'mon,wed,fri',
          promiseState: PromiseState.NotCompleted,
          createdAt: new Date(),
          user: null,
          chates: null,
        },
      ]);
      mockPromiseService.getPromises.mockResolvedValue(promisesResponse);

      const result = await controller.findAll(
        userEmail,
        getPromsiesRequest,
        getPromiseBodyRequest,
      );

      expect(result).toBe(promisesResponse);
      expect(mockPromiseService.getPromises).toHaveBeenCalledWith(
        userEmail,
        getPromsiesRequest,
        getPromiseBodyRequest,
      );
    });
  });

  describe('update', () => {
    it('should update a promise', async () => {
      const id = 'test-uuid';
      const userEmail = 'test@example.com';
      const updatePromiseRequest: UpdatePromiseRequest = {
        title: 'Updated Promise',
        dayOfWeek: ['tue', 'thu'],
      };
      mockPromiseService.updatePromise.mockResolvedValue(true);

      const result = await controller.update(
        id,
        userEmail,
        updatePromiseRequest,
      );

      expect(result).toBe(true);
      expect(mockPromiseService.updatePromise).toHaveBeenCalledWith(
        id,
        userEmail,
        updatePromiseRequest,
      );
    });
  });

  describe('delete', () => {
    it('should delete a promise', async () => {
      const id = 'test-uuid';
      const userEmail = 'test@example.com';
      mockPromiseService.deletePromise.mockResolvedValue(true);

      const result = await controller.delete(id, userEmail);

      expect(result).toBe(true);
      expect(mockPromiseService.deletePromise).toHaveBeenCalledWith(
        id,
        userEmail,
      );
    });
  });

  describe('changeState', () => {
    it('should change promise state', async () => {
      const id = 'test-uuid';
      const userEmail = 'test@example.com';
      const changePromiseStateRequest: ChangePromiseStateRequest = {
        promiseState: 'Completed',
      };
      mockPromiseService.changePromiseState.mockResolvedValue(true);

      const result = await controller.changeState(
        id,
        userEmail,
        changePromiseStateRequest,
      );

      expect(result).toBe(true);
      expect(mockPromiseService.changePromiseState).toHaveBeenCalledWith(
        id,
        userEmail,
        changePromiseStateRequest,
      );
    });
  });
});
