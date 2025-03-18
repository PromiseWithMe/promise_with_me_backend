import { Module } from '@nestjs/common';
import { PromiseService } from './promise.service';
import { PromiseController } from './promise.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Promise])],
  controllers: [PromiseController],
  providers: [PromiseService],
})
export class PromiseModule {}
