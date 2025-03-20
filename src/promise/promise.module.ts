import { Module } from '@nestjs/common';
import { PromiseService } from './promise.service';
import { PromiseController } from './promise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Promise } from './entity/promise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Promise, User])],
  controllers: [PromiseController],
  providers: [PromiseService],
})
export class PromiseModule {}
