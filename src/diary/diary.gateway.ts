import {
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { DiaryService } from './diary.service';
import { ExecutionContext, UseGuards } from '@nestjs/common';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { Socket } from 'socket.io';
import { WsJwtGuard } from 'src/common/guard/ws-jwt-guard';

@WebSocketGateway()
@UseGuards(WsJwtGuard)
@WebSocketGateway()
export class DiaryGateway implements OnGatewayConnection {
  constructor(
    private readonly diaryService: DiaryService,
    private readonly wsJwtGuard: WsJwtGuard,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const createWsExecutionContext = () => {
        return {
          switchToWs: () => ({
            getClient: () => client,
          }),
          getHandler: () => this.handleConnection,
        } as unknown as ExecutionContext;
      };

      await this.wsJwtGuard.canActivate(createWsExecutionContext());
      const userEmail = client.data.user.email;

      this.diaryService.getDiary(userEmail, client);
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage('setDiary')
  setDiary(@GetUserEmail() userEmail: string, @MessageBody() data: string) {
    this.diaryService.setDiary(userEmail, data);
  }
}
