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
        entities: [User, Promise],
        synchronize: true,
      }),
    }),
    JwtModule.register({ global: true }),
    AuthModule,
    UserModule,
    PromiseModule,
    ChatModule,
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
