import { PartialType } from '@nestjs/mapped-types';
import { CreatePromiseDto } from './create-promise.dto';

export class UpdatePromiseDto extends PartialType(CreatePromiseDto) {}
