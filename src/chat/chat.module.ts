import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promise } from 'src/promise/entity/promise.entity';
import { Chat } from './entity/chat.entity';
import { User } from 'src/user/entity/user.entity';
import { ChatController } from './chat.controller';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from 'src/common/enum/env-keys';

@Module({
  imports: [TypeOrmModule.forFeature([Promise, Chat, User])],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    {
      provide: OpenAI,
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        return new OpenAI({
          apiKey: configService.get(EnvKeys.CHAT_GPT_KEY),
        });
      },
    },
  ],
})
export class ChatModule {}
