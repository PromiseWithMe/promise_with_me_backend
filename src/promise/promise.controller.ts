import { Controller } from '@nestjs/common';
import { PromiseService } from './promise.service';

@Controller('promise')
export class PromiseController {
  constructor(private readonly promiseService: PromiseService) {}
}
