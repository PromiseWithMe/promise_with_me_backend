import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promise } from 'src/promise/entity/promise.entity';
import { Chat } from '../entity/chat.entity';
import { User } from 'src/user/entity/user.entity';
import { ROLE } from 'src/common/enum/role';
import { FindChatsReponse } from '../dto/response/find-chats.response';
import { PromiseNotFoundException } from 'src/exception/ws-custom-exception/promise-not-found.exception';
import { WellPromiseRequest } from '../dto/request/well-promise.request';
import { ChatGPTException } from 'src/exception/ws-custom-exception/chat-gpt.exception';
import { SaveChatErrorException } from 'src/exception/ws-custom-exception/save-chat-error.exception';
import OpenAI from 'openai';

const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

describe('ChatService', () => {
  let service: ChatService;
  let promiseRepository: Repository<Promise>;
  let chatRepository: Repository<Chat>;
  let openai: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(Promise),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Chat),
          useClass: Repository,
        },
        {
          provide: OpenAI,
          useValue: mockOpenAI,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    promiseRepository = module.get<Repository<Promise>>(getRepositoryToken(Promise));
    chatRepository = module.get<Repository<Chat>>(getRepositoryToken(Chat));
    openai = module.get(OpenAI);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find', () => {
    it('should return chats for a valid promise', async () => {
      const userEmail = 'test@example.com';
      const promiseId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPromise = { id: promiseId };
      const mockChats = [
        { id: 1, role: ROLE.USER, content: '약속을 더 쉽게 지키는 법', createdAt: new Date() },
        { id: 2, role: ROLE.SYSTEM, content: '답변 내용', createdAt: new Date() },
      ];

      jest.spyOn(promiseRepository, 'findOne').mockResolvedValue(mockPromise as Promise);
      jest.spyOn(chatRepository, 'find').mockResolvedValue(mockChats as Chat[]);

      const result = await service.find(userEmail, promiseId);

      expect(promiseRepository.findOne).toHaveBeenCalledWith({
        where: { id: promiseId, user: { email: userEmail } },
      });
      expect(chatRepository.find).toHaveBeenCalledWith({
        where: { promise: { id: promiseId } },
      });
      expect(result).toBeInstanceOf(FindChatsReponse);
      expect(result.chats.length).toBe(2);
      expect(result.chats[0].id).toBe(1);
      expect(result.chats[0].role).toBe(ROLE.USER);
    });

    it('should throw PromiseNotFoundException when promise not found', async () => {
      const userEmail = 'test@example.com';
      const promiseId = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(promiseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.find(userEmail, promiseId)).rejects.toThrow(PromiseNotFoundException);
    });
  });

  describe('wellPromise', () => {
    it('should process a well promise request successfully', async () => {
      const userEmail = 'test@example.com';
      const data: WellPromiseRequest = {
        promiseId: '123e4567-e89b-12d3-a456-426614174000',
        message: '운동 약속 지키기',
      };
      
      const mockClient = {
        emit: jest.fn(),
      };
      
      const mockPromise = { 
        id: data.promiseId,
        user: { email: userEmail } 
      };
      
      const mockChunkGenerator = async function*() {
        yield { choices: [{ delta: { content: 'Test' } }] };
        yield { choices: [{ delta: { content: ' response' } }] };
      };

      jest.spyOn(promiseRepository, 'findOne').mockResolvedValue(mockPromise as Promise);
      jest.spyOn(openai.chat.completions, 'create').mockResolvedValue(mockChunkGenerator());
      jest.spyOn(chatRepository, 'save').mockResolvedValue({} as Chat);

      await service.wellPromise(userEmail, data, mockClient as any);

      expect(promiseRepository.findOne).toHaveBeenCalledWith({
        where: { id: data.promiseId, user: { email: userEmail } },
      });
      
      expect(openai.chat.completions.create).toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith('wellPromiseResponse', 'Test');
      expect(mockClient.emit).toHaveBeenCalledWith('wellPromiseResponse', ' response');
      expect(mockClient.emit).toHaveBeenCalledWith('wellPromiseEnd', 'Test response');
      
      expect(chatRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should throw PromiseNotFoundException when promise not found', async () => {
      const userEmail = 'test@example.com';
      const data: WellPromiseRequest = {
        promiseId: '123e4567-e89b-12d3-a456-426614174000',
        message: '운동 약속 지키기',
      };
      
      const mockClient = { emit: jest.fn() };

      jest.spyOn(promiseRepository, 'findOne').mockResolvedValue(null);

      await expect(service.wellPromise(userEmail, data, mockClient as any))
        .rejects.toThrow(PromiseNotFoundException);
    });

    it('should throw ChatGPTException when OpenAI API fails', async () => {
      const userEmail = 'test@example.com';
      const data: WellPromiseRequest = {
        promiseId: '123e4567-e89b-12d3-a456-426614174000',
        message: '운동 약속 지키기',
      };
      
      const mockClient = { emit: jest.fn() };
      const mockPromise = { id: data.promiseId, user: { email: userEmail } };

      jest.spyOn(promiseRepository, 'findOne').mockResolvedValue(mockPromise as Promise);
      jest.spyOn(openai.chat.completions, 'create').mockRejectedValue(new Error('API Error'));

      await expect(service.wellPromise(userEmail, data, mockClient as any))
        .rejects.toThrow(ChatGPTException);
    });

    it('should throw SaveChatErrorException when chat save fails', async () => {
      const userEmail = 'test@example.com';
      const data: WellPromiseRequest = {
        promiseId: '123e4567-e89b-12d3-a456-426614174000',
        message: '운동 약속 지키기',
      };
      
      const mockClient = { emit: jest.fn() };
      const mockPromise = { id: data.promiseId, user: { email: userEmail } };
      
      const mockChunkGenerator = async function*() {
        yield { choices: [{ delta: { content: 'Test response' } }] };
      };

      jest.spyOn(promiseRepository, 'findOne').mockResolvedValue(mockPromise as Promise);
      jest.spyOn(openai.chat.completions, 'create').mockResolvedValue(mockChunkGenerator());
      jest.spyOn(chatRepository, 'save').mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.wellPromise(userEmail, data, mockClient as any))
        .rejects.toThrow(SaveChatErrorException);
    });
  });
});
