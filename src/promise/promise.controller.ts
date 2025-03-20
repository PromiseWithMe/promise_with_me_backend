import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PromiseService } from './promise.service';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { GetPromsieRequest } from './dto/request/get-promise.request';

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

  @Get()
  getPromises(
    @GetUserEmail() userEmail: string,
    @Query() getPromise: GetPromsieRequest,
  ) {
    return this.promiseService.getPromises(userEmail, getPromise);
  }
}
