import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../chat.controller';
import { ChatService } from '../chat.service';
import { FindChatsReponse } from '../dto/response/find-chats.response';
import { ROLE } from 'src/common/enum/role';

describe('ChatController', () => {
  let controller: ChatController;
  let service: ChatService;

  beforeEach(async () => {
    const mockChatService = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    controller = module.get<ChatController>(ChatController);
    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getChats', () => {
    it('should return an array of chats', async () => {
      const userEmail = 'test@example.com';
      const promiseId = '123e4567-e89b-12d3-a456-426614174000';
      
      const expectedResult = new FindChatsReponse([
        {
          id: 1,
          role: ROLE.USER,
          content: '약속을 더 쉽게 지키는 법',
          createdAt: new Date(),
          promise: null,
        },
        {
          id: 2,
          role: ROLE.SYSTEM,
          content: '답변 내용',
          createdAt: new Date(),
          promise: null,
        },
      ]);
      
      jest.spyOn(service, 'find').mockResolvedValue(expectedResult);

      const result = await controller.getChats(userEmail, promiseId);
      
      expect(service.find).toHaveBeenCalledWith(userEmail, promiseId);
      expect(result).toEqual(expectedResult);
    });
  });
});
