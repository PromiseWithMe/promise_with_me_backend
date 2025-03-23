import { WebSocketGateway } from '@nestjs/websockets';
import { DiaryService } from './diary.service';

@WebSocketGateway()
export class DiaryGateway {
  constructor(private readonly diaryService: DiaryService) {}
}
