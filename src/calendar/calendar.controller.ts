import { Body, Controller, Get, UseInterceptors } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { GetEntityManager } from 'src/common/decorator/get-query-runner';
import { EntityManager } from 'typeorm';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { GetCalendarRequest } from './dto/request/get-calendar.request';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getCalendar(
    @GetUserEmail() userEmail: string,
    @Body() getCalendarRequest: GetCalendarRequest,
  ) {
    return this.calendarService.getCalendar(userEmail, getCalendarRequest);
  }

  @UseInterceptors(TransactionInterceptor)
  async saveCalendar(@GetEntityManager() entityManager: EntityManager) {
    return this.calendarService.saveCalendar(entityManager);
  }
}
