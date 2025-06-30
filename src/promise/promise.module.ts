import { Module } from '@nestjs/common';
import { PromiseService } from './promise.service';
import { PromiseController } from './promise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Promise } from './entity/promise.entity';
import { Chat } from 'src/chat/entity/chat.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { FcmModule } from 'src/fcm/fcm.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    FcmModule,
    TypeOrmModule.forFeature([Promise, User, Chat]),
  ],
  controllers: [PromiseController],
  providers: [PromiseService],
})
export class PromiseModule {}
