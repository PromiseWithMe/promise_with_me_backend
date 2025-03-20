import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promise } from './entity/promise.entity';
import { DataSource, Repository } from 'typeorm';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { User } from 'src/user/entity/user.entity';
import { UserNotFoundException } from 'src/exception/custom-exception/user-not-found.exception';
import { ServerException } from 'src/exception/custom-exception/server.exception';

@Injectable()
export class PromiseService {
  constructor(
    @InjectRepository(Promise)
    private readonly promiseRepository: Repository<Promise>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly datasource: DataSource,
  ) {}

  async createPromise(
    userEmail: string,
    createPromiseRequest: CreatePromiseRequest,
  ) {
    const { title, dayOfWeek } = createPromiseRequest;
    const user = await this.userRepository.findOne({
      where: { email: userEmail },
    });
    if (!user) throw new UserNotFoundException();

    const qr = this.datasource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      await qr.manager.save(Promise, {
        title,
        dayOfWeek: dayOfWeek.toString(),
        user,
      });

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();
      console.log(error);

      throw new ServerException();
    } finally {
      await qr.release();
    }
  }
}
