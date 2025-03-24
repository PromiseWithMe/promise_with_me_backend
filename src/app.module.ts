import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import * as Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/guard/jwt-guard';
import { EnvKeys } from './common/enum/env-keys';
import { PromiseModule } from './promise/promise.module';
import { User } from './user/entity/user.entity';
import { Promise } from './promise/entity/promise.entity';
import { ChatModule } from './chat/chat.module';
import { Chat } from './chat/entity/chat.entity';
import { DiaryModule } from './diary/diary.module';
import { CalenderModule } from './calender/calender.module';
import { Calender } from './calender/entity/calender.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_SECRET_REFRESH: Joi.string().required(),
        CHAT_GPT_KEY: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get(EnvKeys.DB_HOST),
        port: configService.get(EnvKeys.DB_PORT),
        username: configService.get(EnvKeys.DB_USERNAME),
        password: configService.get(EnvKeys.DB_PASSWORD),
        database: configService.get(EnvKeys.DB_DATABASE),
        entities: [User, Promise, Chat, Calender],
        synchronize: true,
      }),
    }),
    JwtModule.register({ global: true }),
    AuthModule,
    UserModule,
    PromiseModule,
    ChatModule,
    DiaryModule,
    CalenderModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule {}
