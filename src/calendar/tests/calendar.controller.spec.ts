import { Test, TestingModule } from '@nestjs/testing';
import { CalendarController } from '../calendar.controller';
import { CalendarService } from '../calendar.service';
import { GetCalendarRequest } from '../dto/request/get-calendar.request';
import { EntityManager, DataSource } from 'typeorm';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';

describe('CalendarController', () => {
  let controller: CalendarController;
  let service: CalendarService;

  const mockCalendarService = {
    getCalendar: jest.fn(),
    saveCalendar: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      manager: {},
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalendarController],
      providers: [
        {
          provide: CalendarService,
          useValue: mockCalendarService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        TransactionInterceptor,
      ],
    }).compile();

    controller = module.get<CalendarController>(CalendarController);
    service = module.get<CalendarService>(CalendarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCalendar', () => {
    it('should call calendarService.getCalendar with correct parameters', async () => {
      const userEmail = 'test@example.com';
      const getCalendarRequest: GetCalendarRequest = {
        year: 2023,
        month: 5,
      };
      const expectedResult = [{ id: '1', date: new Date(), diary: 'test' }];

      mockCalendarService.getCalendar.mockResolvedValue(expectedResult);

      const result = await controller.getCalendar(userEmail, getCalendarRequest);

      expect(service.getCalendar).toHaveBeenCalledWith(userEmail, getCalendarRequest);
      expect(result).toBe(expectedResult);
    });
  });

  describe('saveCalendar', () => {
    it('should call calendarService.saveCalendar with entityManager', async () => {
      const mockEntityManager = {} as EntityManager;
      const expectedResult = [];

      mockCalendarService.saveCalendar.mockResolvedValue(expectedResult);

      const result = await controller.saveCalendar(mockEntityManager);

      expect(service.saveCalendar).toHaveBeenCalledWith(mockEntityManager);
      expect(result).toBe(expectedResult);
    });
  });
});
