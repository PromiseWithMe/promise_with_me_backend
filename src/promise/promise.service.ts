import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promise } from './entity/promise.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreatePromiseRequest } from './dto/request/create-promise.request';
import { User } from 'src/user/entity/user.entity';
import { UserNotFoundException } from 'src/exception/custom-exception/user-not-found.exception';
import { ServerException } from 'src/exception/custom-exception/server.exception';
import { GetPromsiesRequest } from './dto/request/get-promises.request';
import { UpdatePromiseRequest } from './dto/request/update-promise.request';
import { PromiseNotFoundException } from 'src/exception/custom-exception/promise-not-found.exception';
import { PromiseState } from 'src/common/enum/promise-state';
import { ChangePromiseStateRequest } from './dto/request/change-promise-state.request';
import { GetPromisesResponse } from './dto/response/get-promises.response';
import { GetPromiseBodyRequest } from './dto/request/get-promise-body.request';

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
    entityManager: EntityManager,
    userEmail: string,
    createPromiseRequest: CreatePromiseRequest,
  ) {
    const { title, dayOfWeek } = createPromiseRequest;

    const user = await entityManager.findOne(User, {
      where: { email: userEmail },
    });
    if (!user) throw new UserNotFoundException();

    await entityManager.save(Promise, {
      title,
      dayOfWeek: dayOfWeek.length === 0 ? null : dayOfWeek.toString(),
      user,
    });

    return true;
  }

  async getPromises(
    userEmail: string,
    getPromsiesRequest: GetPromsiesRequest,
    getPromiseBodyRequest: GetPromiseBodyRequest,
  ) {
    try {
      const takeNumber = 10;
      const { page = 0 } = getPromsiesRequest;
      const { dayOfWeek } = getPromiseBodyRequest;

      const query = this.promiseRepository
        .createQueryBuilder('p')
        .skip(page * takeNumber)
        .take(takeNumber)
        .where('p.userEmail = :userEmail', { userEmail });

      if (dayOfWeek) {
        dayOfWeek.forEach((day, index) => {
          query.andWhere(`FIND_IN_SET(:day, p.dayOfWeek)`, {
            day,
          });
        });
      }

      query.orderBy('p.createdAt', 'DESC')

      return new GetPromisesResponse(
        await query.getMany()
      );
    } catch (error) {
      throw new ServerException();
    }
  }

  async updatePromise(
    entityManager: EntityManager,
    promiseId: string,
    userEmail: string,
    updatePromiseRequest: UpdatePromiseRequest,
  ) {
    const { title, dayOfWeek } = updatePromiseRequest;

    const result = await entityManager.update(
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

    return true;
  }

  async deletePromise(
    entityManager: EntityManager,
    promiseId: string,
    userEmail: string,
  ) {
    const result = await entityManager.delete(Promise, {
      id: promiseId,
      user: { email: userEmail },
    });

    if (result.affected === 0) {
      throw new PromiseNotFoundException();
    }

    return true;
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
