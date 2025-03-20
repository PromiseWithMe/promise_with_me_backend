import { Body, Controller, Post } from '@nestjs/common';
import { PromiseService } from './promise.service';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { GetUserEmail } from 'src/common/decorator/get-user';

@Controller('promise')
export class PromiseController {
  constructor(private readonly promiseService: PromiseService) {}

  @Post()
  createPromise(
    @GetUserEmail() userEmail: string,
    @Body() createPromise: CreatePromiseRequest,
  ) {
    return this.promiseService.createPromise(userEmail, createPromise);
  }
}
