import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promise } from './entity/promise.entity';
import { Brackets, Repository } from 'typeorm';
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
import { Chat } from 'src/chat/entity/chat.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FcmService } from 'src/fcm/fcm.service';
import { generateToday } from 'src/common/util/generate-today';
import { dayOfWeeks } from 'src/common/set/day-of-weeks';

@Injectable()
export class PromiseService {
  constructor(
    @InjectRepository(Promise)
    private readonly promiseRepository: Repository<Promise>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly fcmService: FcmService,
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

    await this.promiseRepository.save({
      title,
      dayOfWeek: dayOfWeek.join(','),
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
          query.andWhere(`find_in_set(:day, p.dayOfWeek)`, {
            day,
          });
        });
      }

      query.orderBy('p.createdAt', 'DESC');

      return new GetPromisesResponse(await query.getMany());
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

    const result = await this.promiseRepository.update(
      { id: promiseId, user: { email: userEmail } },
      {
        title,
        dayOfWeek: dayOfWeek ? dayOfWeek.join(',') : undefined,
      },
    );

    if (result.affected === 0) {
      throw new PromiseNotFoundException();
    }

    return true;
  }

  async deletePromise(
    promiseId: string,
    userEmail: string,
  ) {
    const promise = await this.promiseRepository.findOne({
      where: { id: promiseId, user: { email: userEmail } },
    });
    if (!promise) throw new PromiseNotFoundException();


    await this.chatRepository.delete({ promise: { id: promiseId } });
    await this.promiseRepository.delete({
      id: promiseId,
      user: { email: userEmail },
    });

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

  // @Cron('*/10 * * * * *')
  @Cron('0 * * * *')
  async notifyUnfinishedPromises() {
    const today = new Date(generateToday());
    const todayDay = dayOfWeeks[today.getDay()];
    // DB에서 오늘 요일에 할당된, 완료되지 않은 약속을 찾음
    const unfinishedPromises = await this.promiseRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.userEmail', 'userEmail')
      .where('p.promiseState = :state', { state: PromiseState.NotCompleted })
      .andWhere(
        new Brackets((qb) => {
          qb.where('find_in_set(:day, p.dayOfWeek)', { day: todayDay }).orWhere(
            'p.dayOfWeek = :dayOfWeekNull',
            { dayOfWeekNull: '' },
          );
      }),
    ).getRawMany();

    for (const promise of unfinishedPromises) {
      // 유저의 FCM 토큰이 있다고 가정
      const userEmail = promise.user;
      const user = await this.userRepository.findOne({
        where: { email: userEmail },
      });
      
      if (user.deviceToken) {
        await this.fcmService.fcm(
          user.deviceToken,
          '아직 완료되지 않은 약속이 있어요!',
          `오늘 할당된 약속을 모두 완료해주세요!`
        );
      }
    }
  }
}
