import { Chat } from 'src/common/interface/chat.interface';
import { Chat as ChatEntity } from 'src/chat/entity/chat.entity';

export class FindChatsReponse {
  chats: Chat[];

  constructor(chats: ChatEntity[]) {
    this.chats = chats.map((v) => {
      return {
        id: v.id,
        role: v.role,
        content: v.content,
      };
    });
  }
}
