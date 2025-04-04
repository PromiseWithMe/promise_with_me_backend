import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { DiaryController } from './diary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {}
