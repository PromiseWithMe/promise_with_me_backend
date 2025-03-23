import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class DiaryService {
  constructor(
    @InjectRedis()
    private readonly redisClient: Redis,
  ) {}
}
