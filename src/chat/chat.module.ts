import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promise } from 'src/promise/entity/promise.entity';
import { Chat } from './entity/chat.entity';
import { User } from 'src/user/entity/user.entity';
import { ChatController } from './chat.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Promise, Chat, User])],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
