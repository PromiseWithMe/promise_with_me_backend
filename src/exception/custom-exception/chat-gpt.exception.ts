import { HttpStatus } from '@nestjs/common';
import { HttpException } from '../http.exception';

export class ChatGPTException extends HttpException {
  constructor() {
    super(
      '글 생성 중 에러가 발생하였습니다. 다시 시도해 주세요.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
