import { Controller, UseInterceptors } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { GetEntityManager } from 'src/common/decorator/get-query-runner';
import { EntityManager } from 'typeorm';

@Controller('calender')
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}

  @UseInterceptors(TransactionInterceptor)
  async getCalender(@GetEntityManager() qr: EntityManager) {
    return this.calenderService.saveCalender(qr);
  }
}
