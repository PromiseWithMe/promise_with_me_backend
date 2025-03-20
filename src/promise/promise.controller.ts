import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PromiseService } from './promise.service';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { GetPromsieRequest } from './dto/request/get-promise.request';
import { UpdatePromiseRequest } from './dto/request/update-promise.request';
import { IsNotUUidException } from 'src/exception/custom-exception/is-not-uuid.exception';
import { UUIDCheckPipe } from 'src/common/pipe/uuid-check.pipe';

@Controller('promise')
export class PromiseController {
  constructor(private readonly promiseService: PromiseService) {}

  @Post()
  createPromise(
    @GetUserEmail() userEmail: string,
    @Body() createPromiseRequest: CreatePromiseRequest,
  ) {
    return this.promiseService.createPromise(userEmail, createPromiseRequest);
  }

  @Patch('/:id')
  updatePromise(
    @Param('id', UUIDCheckPipe)
    id: string,
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
  deletePromise(
    @Param('id', UUIDCheckPipe)
    id: string,
    @GetUserEmail() userEmail: string,
  ) {
    return this.promiseService.deletePromise(id, userEmail);
  }

  @Get()
  getPromises(
    @GetUserEmail() userEmail: string,
    @Query() getPromsieRequest: GetPromsieRequest,
  ) {
    return this.promiseService.getPromises(userEmail, getPromsieRequest);
  }
}
