import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';

@Injectable()
export class FcmService {
  constructor(private readonly configService: ConfigService) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: configService.get('FB_PROJECT_ID'),
        privateKey: configService.get('FB_PRIVATE_KEY')
          ? configService.get('FB_PRIVATE_KEY').replace(/\\n/gm, '\n')
          : undefined,
        clientEmail: configService.get('FB_CLIENT_EMAIL'),
      }),
    });
  }

  async fcm(token: string, title: string, message: string): Promise<string> {
    const payload: Message = {
      token: token,
      notification: {
        title: title,
        body: message,
      },
      data: {
        body: message,
      },
    };
    const result: string = await admin
      .messaging()
      .send(payload)
      .then((response) => response)
      .catch((error) => error.code);
    return result;
  }
}
