import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Socket } from 'socket.io';
import { EnvKeys } from 'src/common/enum/env-keys';
import { ChatGPTException } from 'src/exception/custom-exception/chat-gpt.exception';

@Injectable()
export class ChatService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get(EnvKeys.CHAT_GPT_KEY),
    });
  }

  async chat(data: string, client: Socket) {
    try {
      let fullResponse = '';
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
            "${data}" 약속을 지키는 방법을 알려줘\n
            나누어서 읽어야할 부분은 "\\n"표시를 해줘`
          },
        ],
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          client.emit('chatResponse', content);
        }
      }

      client.emit('chatEnd', fullResponse);
    } catch (error) {
      throw new ChatGPTException();
    }
  }
}
