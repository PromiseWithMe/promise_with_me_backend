import {
  ArgumentMetadata,
  Injectable,
  ParseUUIDPipe,
  PipeTransform,
} from '@nestjs/common';
import { IsNotUUidException } from 'src/exception/custom-exception/is-not-uuid.exception';

@Injectable()
export class UUIDCheckPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const uuidPipe = new ParseUUIDPipe();
    try {
      await uuidPipe.transform(value, metadata);;
      return value;
    } catch (error) {
      throw new IsNotUUidException();
    }
  }
}
