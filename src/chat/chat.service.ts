import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Socket } from 'socket.io';
import { EnvKeys } from 'src/common/enum/env-keys';
import { ChatGPTException } from 'src/exception/ws-custom-exception/chat-gpt.exception';
import { Chat } from './entity/chat.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLE } from 'src/common/enum/role';
import { WellPromiseRequest } from './dto/request/well-promise.request';
import { Promise } from 'src/promise/entity/promise.entity';
import { PromiseNotFoundException } from 'src/exception/ws-custom-exception/promise-not-found.exception';
import { SaveChatErrorException } from 'src/exception/ws-custom-exception/save-chat-error.exception';
import { generateToday } from 'src/common/util/generate-today';
import { User } from 'src/user/entity/user.entity';
import { FindChatsReponse } from './dto/response/find-chats.response';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(Promise)
    private readonly promiseRepository: Repository<Promise>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get(EnvKeys.CHAT_GPT_KEY),
    });
  }

  async wellPromise(
    userEmail: string,
    data: WellPromiseRequest,
    client: Socket,
  ) {
    let fullResponse = '';
    const { promiseId, message } = data;

    const promise = await this.promiseRepository.findOne({
      where: { id: promiseId, user: { email: userEmail } },
    });
    if (!promise) throw new PromiseNotFoundException();

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [
          //   {
          //     role: 'system',
          //     content: `너는 내가 나와의 약속을 지키도록 돕는 AI야.\n
          //     "${data}" 약속을 지키는 방법을 JSON 형식으로 알려줘\n
          //     JSON 외의 출력은 허용하지 않아\n
          //     JSON 형식: {"helpList":[{"description":"설명"}]}`,
          //   },
          {
            role: 'system',
            content: `너는 내가 나와의 약속을 지키도록 돕는 AI야.\n
            "${message}" 약속을 지키는 방법을 알려줘\n
            답변 형식 : "1.소제목 : 내용"\n
            대답에 스타일을 적용하지 말아줘\n
            `,
          },
        ],
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          client.emit('wellPromiseResponse', content);
        }
      }

      client.emit('wellPromiseEnd', fullResponse);
    } catch (error) {
      throw new ChatGPTException();
    }

    try {
      await this.chatRepository.save({
        promise,
        content: '약속을 더 쉽게 지키는 법',
        role: ROLE.USER,
        createdAt: generateToday(),
      });
      await this.chatRepository.save({
        promise,
        content: fullResponse,
        role: ROLE.SYSTEM,
        createdAt: generateToday(),
      });
    } catch (error) {
      throw new SaveChatErrorException();
    }
  }

  async find(userEmail: string, promiseId: string) {
    const promise = await this.promiseRepository.findOne({
      where: { id: promiseId, user: { email: userEmail } },
    });
    if (!promise) throw new PromiseNotFoundException();

    return new FindChatsReponse(
      await this.chatRepository.find({
        where: { promise: { id: promiseId } },
      }),
    );
  }
}
