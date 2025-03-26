import { Module } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { CalenderController } from './calender.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuccessPromise } from './entity/success-promise.entity';
import { Calender } from './entity/calender.entity';
import { Promise } from 'src/promise/entity/promise.entity';
import { User } from 'src/user/entity/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Promise, SuccessPromise, Calender, User]),
  ],
  controllers: [CalenderController],
  providers: [CalenderService],
})
export class CalenderModule {}
