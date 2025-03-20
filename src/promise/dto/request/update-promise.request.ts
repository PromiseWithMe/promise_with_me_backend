import { PartialType } from '@nestjs/mapped-types';
import { CreatePromiseRequest } from './create-promise.request';

export class UpdatePromiseRequest extends PartialType(CreatePromiseRequest) {}
