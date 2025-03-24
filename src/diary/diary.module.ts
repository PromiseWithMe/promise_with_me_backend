import { Module } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { DiaryGateway } from './diary.gateway';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { EnvKeys } from 'src/common/enum/env-keys';
import { WsJwtGuard } from 'src/common/guard/ws-jwt-guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
  providers: [WsJwtGuard, DiaryGateway, DiaryService],
})
export class DiaryModule {}
