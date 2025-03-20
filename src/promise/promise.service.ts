import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promise } from './entity/promise.entity';
import { DataSource, Repository } from 'typeorm';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { User } from 'src/user/entity/user.entity';
import { UserNotFoundException } from 'src/exception/custom-exception/user-not-found.exception';
import { ServerException } from 'src/exception/custom-exception/server.exception';
import { GetPromsieRequest } from './dto/request/get-promise.request';
import { UpdatePromiseRequest } from './dto/request/update-promise.request';
import { HttpException } from 'src/exception/http.exception';
import { PromiseNotFoundException } from 'src/exception/custom-exception/promise-not-found.exception';
import { PromiseState } from 'src/common/enum/promise-state';
import { ChangePromiseStateRequest } from './dto/request/change-promise-state.request';

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

  async getPromises(userEmail: string, getPromsieRequest: GetPromsieRequest) {
    try {
      const takeNumber = 10;
      const { page = 0 } = getPromsieRequest;

      return await this.promiseRepository.find({
        where: { user: { email: userEmail } },
        skip: page * takeNumber,
        take: takeNumber,
      });
    } catch (error) {
      throw new ServerException();
    }
  }

  async updatePromise(
    promiseId: string,
    userEmail: string,
    updatePromiseRequest: UpdatePromiseRequest,
  ) {
    const { title, dayOfWeek } = updatePromiseRequest;

    const qr = this.datasource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const result = await qr.manager.update(
        Promise,
        { id: promiseId, user: { email: userEmail } },
        {
          title,
          dayOfWeek: dayOfWeek ? dayOfWeek.toString() : undefined,
        },
      );

      if (result.affected === 0) {
        throw new PromiseNotFoundException();
      }

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();

      if (error instanceof HttpException) throw error;

      throw new ServerException();
    } finally {
      await qr.release();
    }
  }

  async deletePromise(promiseId: string, userEmail: string) {
    const qr = this.datasource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const result = await this.promiseRepository.delete({
        id: promiseId,
        user: { email: userEmail },
      });

      if (result.affected === 0) {
        throw new PromiseNotFoundException();
      }

      await qr.commitTransaction();
      return true;
    } catch (error) {
      await qr.rollbackTransaction();

      if (error instanceof HttpException) throw error;

      throw new ServerException();
    } finally {
      await qr.release();
    }
  }

  async changePromiseState(
    promiseId: string,
    userEmail: string,
    changePromiseStateRequest: ChangePromiseStateRequest,
  ) {
    const result = await this.promiseRepository.update(
      { id: promiseId, user: { email: userEmail } },
      { promiseState: PromiseState[changePromiseStateRequest.promiseState] },
    );

    if (result.affected === 0) {
      throw new PromiseNotFoundException();
    }

    return true;
  }
}
