import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { PromiseService } from './promise.service';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { GetPromsiesRequest } from './dto/request/get-promises.request';
import { UpdatePromiseRequest } from './dto/request/update-promise.request';
import { UUIDCheckPipe } from 'src/common/pipe/uuid-check.pipe';
import { ChangePromiseStateRequest } from './dto/request/change-promise-state.request';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { GetEntityManager } from 'src/common/decorator/get-query-runner';
import { EntityManager } from 'typeorm';
import { GetPromiseBodyRequest } from './dto/request/get-promise-body.request';

@Controller('promise')
export class PromiseController {
  constructor(private readonly promiseService: PromiseService) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  create(
    @GetEntityManager() entityManager: EntityManager,
    @GetUserEmail() userEmail: string,
    @Body() createPromiseRequest: CreatePromiseRequest,
  ) {
    return this.promiseService.createPromise(
      entityManager,
      userEmail,
      createPromiseRequest,
    );
  }

  @Get()
  findAll(
    @GetUserEmail() userEmail: string,
    @Query() getPromsieRequest: GetPromsiesRequest,
    @Body() getPromiseBodyRequest: GetPromiseBodyRequest
  ) {
    return this.promiseService.getPromises(
      userEmail,
      getPromsieRequest,
      getPromiseBodyRequest,
    );
  }

  @Patch('/:id')
  @UseInterceptors(TransactionInterceptor)
  update(
    @GetEntityManager() entityManager: EntityManager,
    @Param('id', UUIDCheckPipe) id: string,
    @GetUserEmail() userEmail: string,
    @Body() updatePromiseRequest: UpdatePromiseRequest,
  ) {
    return this.promiseService.updatePromise(
      entityManager,
      id,
      userEmail,
      updatePromiseRequest,
    );
  }

  @Delete('/:id')
  @UseInterceptors(TransactionInterceptor)
  delete(
    @GetEntityManager() entityManager: EntityManager,
    @Param('id', UUIDCheckPipe) id: string,
    @GetUserEmail() userEmail: string,
  ) {
    return this.promiseService.deletePromise(entityManager, id, userEmail);
  }

  @Patch('/:id/state')
  changeState(
    @Param('id', UUIDCheckPipe) id: string,
    @GetUserEmail() userEmail: string,
    @Body() changePromiseStateRequest: ChangePromiseStateRequest,
  ) {
    return this.promiseService.changePromiseState(
      id,
      userEmail,
      changePromiseStateRequest,
    );
  }
}
