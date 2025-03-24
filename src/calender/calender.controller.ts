import { Controller } from '@nestjs/common';
import { CalenderService } from './calender.service';

@Controller('calender')
export class CalenderController {
  constructor(private readonly calenderService: CalenderService) {}
}
