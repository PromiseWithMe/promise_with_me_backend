import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PromiseService } from './promise.service';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { GetPromsiesRequest } from './dto/request/get-promises.request';
import { UpdatePromiseRequest } from './dto/request/update-promise.request';
import { UUIDCheckPipe } from 'src/common/pipe/uuid-check.pipe';
import { ChangePromiseStateRequest } from './dto/request/change-promise-state.request';
import { GetPromiseBodyRequest } from './dto/request/get-promise-body.request';

@Controller('promise')
export class PromiseController {
  constructor(private readonly promiseService: PromiseService) {}

  @Post()
  create(
    @GetUserEmail() userEmail: string,
    @Body() createPromiseRequest: CreatePromiseRequest,
  ) {
    return this.promiseService.createPromise(userEmail, createPromiseRequest);
  }

  @Get()
  findAll(
    @GetUserEmail() userEmail: string,
    @Query() getPromsieRequest: GetPromsiesRequest,
    @Body() getPromiseBodyRequest: GetPromiseBodyRequest,
  ) {
    return this.promiseService.getPromises(
      userEmail,
      getPromsieRequest,
      getPromiseBodyRequest,
    );
  }

  @Patch('/:id')
  update(
    @Param('id', UUIDCheckPipe) id: string,
    @GetUserEmail() userEmail: string,
    @Body() updatePromiseRequest: UpdatePromiseRequest,
  ) {
    return this.promiseService.updatePromise(
      id,
      userEmail,
      updatePromiseRequest,
    );
  }

  @Delete('/:id')
  delete(
    @Param('id', UUIDCheckPipe) id: string,
    @GetUserEmail() userEmail: string,
  ) {
    return this.promiseService.deletePromise(id, userEmail);
  }

  @Patch('/state/:id')
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
