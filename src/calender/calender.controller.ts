import { Body, Controller, Get, UseInterceptors } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { GetEntityManager } from 'src/common/decorator/get-query-runner';
import { EntityManager } from 'typeorm';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { GetCalenderRequest } from './dto/request/get-calender.request';

@Controller('calender')
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}

  @Get()
  async getCalender(
    @GetUserEmail() userEmail: string,
    @Body() getCalenderRequest: GetCalenderRequest,
  ) {
    return this.calenderService.getCalender(userEmail, getCalenderRequest);
  }

  @UseInterceptors(TransactionInterceptor)
  async saveCalender(@GetEntityManager() entityManager: EntityManager) {
    return this.calenderService.saveCalender(entityManager);
  }
}
