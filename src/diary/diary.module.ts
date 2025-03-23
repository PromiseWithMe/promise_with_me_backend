import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryGateway } from './diary.gateway';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from 'src/common/enum/env-keys';

@Module({
  imports: [
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'single',
        options: {
          host: config.get(EnvKeys.REDIS_HOST),
          port: config.get(EnvKeys.REDIS_PORT),
        },
      }),
    }),
  ],
  providers: [DiaryGateway, DiaryService],
})
export class DiaryModule {}
