import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Socket } from 'socket.io';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRedis()
    private readonly redisClient: Redis,
  ) {}

  async getDiary(userEmail: string) {
    return await this.redisClient.get(userEmail);
  }

  async setDiary(userEmail: string, data: string) {
    await this.redisClient.set(userEmail, data);
  }
}
