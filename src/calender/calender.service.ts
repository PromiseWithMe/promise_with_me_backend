import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promise as PromiseEntity } from 'src/promise/entity/promise.entity';
import { In, Repository } from 'typeorm';
import { SuccessPromise } from './entity/success-promise.entity';
import { Calender } from './entity/calender.entity';
import { PromiseState } from 'src/common/enum/promise-state';
import { generateToday } from 'src/common/util/generate-today';
import { User } from 'src/user/entity/user.entity';
import { dayOfWeeks } from 'src/common/set/day-of-weeks';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CalenderService {
  constructor(
    @InjectRepository(PromiseEntity)
    private readonly promiseRepository: Repository<PromiseEntity>,
    @InjectRepository(SuccessPromise)
    private readonly successPromiseRepository: Repository<SuccessPromise>,
    @InjectRepository(Calender)
    private readonly calenderRepository: Repository<Calender>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async saveCalender() {
    const completePromisesUsers = await this.promiseRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.userEmail', 'userEmail')
      .where('p.promiseState = :state', {
        state: PromiseState.Completed.toString(),
      })
      .andWhere('find_in_set(:day, p.dayOfWeek)', {
        day: dayOfWeeks[new Date(generateToday()).getDay()],
      })
      .getRawMany();

    const userEmails = completePromisesUsers.map((u) => u.userEmail);
    if (userEmails.length === 0) return [];

    const users = await this.userRepository.find({
      where: { email: In(userEmails) },
    });
    const userMap = new Map(users.map((user) => [user.email, user]));

    for (const userEmail of userEmails) {
      const user = userMap.get(userEmail);
      if (!user) continue;

      const calender = await this.calenderRepository.save({
        diary: null,
        date: generateToday(),
        user,
      });

      const completedPromises = await this.promiseRepository
        .createQueryBuilder('p')
        .select('p.title', 'title')
        .where('p.userEmail = :userEmail', { userEmail })
        .andWhere('p.promiseState = :state', {
          state: PromiseState.Completed.toString(),
        })
        .andWhere('find_in_set(:day, p.dayOfWeek)', {
          day: dayOfWeeks[new Date(generateToday()).getDay()],
        })
        .getRawMany();

      await Promise.all(completedPromises.map(({ title }) => {
        this.successPromiseRepository.save({
          title,
          calender,
        });
      }));
    }
  }
}
