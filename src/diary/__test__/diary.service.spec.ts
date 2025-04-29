import { Test, TestingModule } from '@nestjs/testing';
import { DiaryService } from '../diary.service';
import Redis from 'ioredis';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

describe('DiaryService', () => {
  let service: DiaryService;
  let redisClient: Redis;

  beforeEach(async () => {
    const redisClientMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiaryService,
        {
          provide: getRedisConnectionToken(),
          useValue: redisClientMock,
        },
      ],
    }).compile();

    service = module.get<DiaryService>(DiaryService);
    redisClient = module.get<Redis>(getRedisConnectionToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDiary', () => {
    it('should return diary data from Redis', async () => {
      const userEmail = 'test@example.com';
      const diaryData = 'Test diary content';
      
      jest.spyOn(redisClient, 'get').mockResolvedValue(diaryData);
      
      const result = await service.getDiary(userEmail);
      
      expect(redisClient.get).toHaveBeenCalledWith(`${userEmail}_diary`);
      expect(result).toEqual(diaryData);
    });

    it('should return null when diary not found', async () => {
      const userEmail = 'test@example.com';
      
      jest.spyOn(redisClient, 'get').mockResolvedValue(null);
      
      const result = await service.getDiary(userEmail);
      
      expect(redisClient.get).toHaveBeenCalledWith(`${userEmail}_diary`);
      expect(result).toBeNull();
    });
  });

  describe('setDiary', () => {
    it('should set diary data in Redis', async () => {
      const userEmail = 'test@example.com';
      const diaryData = 'Test diary content';
      
      jest.spyOn(redisClient, 'set').mockResolvedValue('OK');
      
      await service.setDiary(userEmail, diaryData);
      
      expect(redisClient.set).toHaveBeenCalledWith(`${userEmail}_diary`, diaryData);
    });
  });
});