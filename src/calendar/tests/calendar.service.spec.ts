import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from '../calendar.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Promise as PromiseEntity } from 'src/promise/entity/promise.entity';
import { User } from 'src/user/entity/user.entity';
import { Calendar } from '../entity/calendar.entity';
import { EntityManager, Repository } from 'typeorm';
import Redis from 'ioredis';
import { ServerException } from 'src/exception/custom-exception/server.exception';
import { GetCalendarRequest } from '../dto/request/get-calendar.request';
import { PromiseState } from 'src/common/enum/promise-state';
import * as generateTodayUtil from 'src/common/util/generate-today';
import { dayOfWeeks } from 'src/common/set/day-of-weeks';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

describe('CalendarService', () => {
  let service: CalendarService;
  let promiseRepository: Repository<PromiseEntity>;
  let userRepository: Repository<User>;
  let calendarRepository: Repository<Calendar>;
  let redisClient: Redis;
  let entityManager: EntityManager;

  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: getRepositoryToken(PromiseEntity),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Calendar),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            find: jest.fn(),
          },
        },
        {
          provide: getRedisConnectionToken(),
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
    promiseRepository = module.get<Repository<PromiseEntity>>(getRepositoryToken(PromiseEntity));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    calendarRepository = module.get<Repository<Calendar>>(getRepositoryToken(Calendar));
    redisClient = module.get<Redis>(getRedisConnectionToken());
    entityManager = {
      save: jest.fn(),
    } as unknown as EntityManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCalendar', () => {
    it('should return calendar data for the given month and year', async () => {
      const userEmail = 'test@example.com';
      const request: GetCalendarRequest = { year: 2023, month: 5 };
      const expectedResult = [
        {
          id: '1',
          date: new Date('2023-05-01'),
          diary: 'diary content',
          successPromises: [{ id: 1, title: 'Success 1' }],
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(expectedResult);

      const result = await service.getCalendar(userEmail, request);

      expect(calendarRepository.createQueryBuilder).toHaveBeenCalledWith('calendar');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('calendar.successPromises', 'successPromise');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('calendar.userEmail = :userEmail', { userEmail });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('calendar.date >= :startDate', { startDate: new Date(2023, 4, 1) });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('calendar.date < :endDate', { endDate: new Date(2023, 5, 1) });
      expect(result).toEqual(expectedResult);
    });

    it('should throw ServerException when database query fails', async () => {
      const userEmail = 'test@example.com';
      const request: GetCalendarRequest = { year: 2023, month: 5 };

      mockQueryBuilder.getMany.mockRejectedValue(new Error('Database error'));

      await expect(service.getCalendar(userEmail, request)).rejects.toThrow(ServerException);
    });
  });

  describe('saveCalendar', () => {
    beforeEach(() => {
      jest.spyOn(generateTodayUtil, 'generateToday').mockReturnValue('2023-05-01');
    });

    it('should save calendar and success promises for users with completed promises', async () => {
      const mockToday = new Date('2023-05-01');
      const mockDayOfWeek = dayOfWeeks[mockToday.getDay()];
      
      const usersWithCompletedPromises = [
        { userEmail: 'user1@example.com' },
        { userEmail: 'user2@example.com' },
      ];

      const users = [
        { email: 'user1@example.com', id: '1' },
        { email: 'user2@example.com', id: '2' },
      ];

      const completedPromises = [
        { title: 'Promise 1' },
        { title: 'Promise 2' },
      ];

      const savedCalendar = {
        id: '1',
        date: mockToday,
        diary: 'diary content',
      };

      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(usersWithCompletedPromises)
        .mockResolvedValueOnce(completedPromises)
        .mockResolvedValueOnce(completedPromises);

      (userRepository.find as jest.Mock).mockResolvedValue(users);
      (redisClient.get as jest.Mock).mockResolvedValue('diary content');
      (entityManager.save as jest.Mock)
        .mockResolvedValueOnce(savedCalendar)
        .mockResolvedValueOnce({ id: 1, title: 'Promise 1' })
        .mockResolvedValueOnce({ id: 2, title: 'Promise 2' });

      await service.saveCalendar(entityManager);

      expect(promiseRepository.createQueryBuilder).toHaveBeenCalledTimes(3);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('p.promiseState = :state', {
        state: PromiseState.Completed.toString(),
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('find_in_set(:day, p.dayOfWeek)', {
        day: mockDayOfWeek,
      });
      expect(userRepository.find).toHaveBeenCalled();
      const findCallArgs = (userRepository.find as jest.Mock).mock.calls[0][0];
      expect(findCallArgs.where.email).toBeDefined();
      expect(findCallArgs.where.email._value).toEqual(
        expect.arrayContaining(['user1@example.com', 'user2@example.com'])
      );
      expect(redisClient.get).toHaveBeenCalledWith('user1@example.com_diary');
      expect(entityManager.save).toHaveBeenCalledTimes(6);
    });

    it('should return empty array when no users have completed promises', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValueOnce([]);

      const result = await service.saveCalendar(entityManager);

      expect(result).toEqual([]);
      expect(userRepository.find).not.toHaveBeenCalled();
      expect(entityManager.save).not.toHaveBeenCalled();
    });
  });
});
