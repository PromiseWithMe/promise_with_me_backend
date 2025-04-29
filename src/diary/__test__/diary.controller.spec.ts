import { Test, TestingModule } from '@nestjs/testing';
import { DiaryController } from '../diary.controller';
import { DiaryService } from '../diary.service';

describe('DiaryController', () => {
  let controller: DiaryController;
  let service: DiaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiaryController],
      providers: [
        {
          provide: DiaryService,
          useValue: {
            getDiary: jest.fn(),
            setDiary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DiaryController>(DiaryController);
    service = module.get<DiaryService>(DiaryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDiary', () => {
    it('should call diaryService.getDiary with correct email', async () => {
      const userEmail = 'test@example.com';
      const diaryData = 'Test diary content';
      
      jest.spyOn(service, 'getDiary').mockResolvedValue(diaryData);
      
      const result = await controller.getDiary(userEmail);
      
      expect(service.getDiary).toHaveBeenCalledWith(userEmail);
      expect(result).toEqual(diaryData);
    });
  });

  describe('setDiary', () => {
    it('should call diaryService.setDiary with correct params', async () => {
      const userEmail = 'test@example.com';
      const diaryData = 'Test diary content';
      
      jest.spyOn(service, 'setDiary').mockResolvedValue(undefined);
      
      const result = await controller.setDiary(userEmail, diaryData);
      
      expect(service.setDiary).toHaveBeenCalledWith(userEmail, diaryData);
      expect(result).toEqual(undefined);
    });
  });
});