import { Module } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { CalenderController } from './calender.controller';

@Module({
  controllers: [CalenderController],
  providers: [CalenderService],
})
export class CalenderModule {}
