import { Module } from '@nestjs/common';
import { CalenderService } from './calender.service';
import { CalenderController } from './calender.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promise } from 'src/promise/entity/promise.entity';
import { User } from 'src/user/entity/user.entity';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from 'src/common/enum/env-keys';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Promise, User]),
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
  controllers: [CalenderController],
  providers: [CalenderService],
})
export class CalenderModule {}
