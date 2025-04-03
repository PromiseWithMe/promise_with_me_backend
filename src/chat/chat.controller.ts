import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UUIDCheckPipe } from 'src/common/pipe/uuid-check.pipe';
import { GetUserEmail } from 'src/common/decorator/get-user';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('/:id')
  getChats(
    @GetUserEmail() userEmail: string,
    @Param('id', UUIDCheckPipe) id: string,
  ) {
    return this.chatService.find(userEmail, id);
  }
}
