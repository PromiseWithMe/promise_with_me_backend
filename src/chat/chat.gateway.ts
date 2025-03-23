import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { WellPromiseRequest } from './dto/request/well-promise.request';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtGuard } from 'src/common/guard/ws-jwt-guard';
import { GetUserEmail } from 'src/common/decorator/get-user';

@WebSocketGateway()
@UseGuards(WsJwtGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory(errors) {
      const messages = errors.map((err) =>
        Object.values(err.constraints).join(', '),
      );

      throw new WsException(messages[0]);
    },
  }),
)
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('wellPromise')
  async wellPromise(
    @GetUserEmail() userEmail: string,
    @MessageBody() data: WellPromiseRequest,
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.wellPromise(userEmail, data, client);
  }
}
