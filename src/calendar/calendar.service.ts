import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Promise as PromiseEntity } from 'src/promise/entity/promise.entity';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { SuccessPromise } from './entity/success-promise.entity';
import { Calendar } from './entity/calendar.entity';
import { PromiseState } from 'src/common/enum/promise-state';
import { generateToday } from 'src/common/util/generate-today';
import { User } from 'src/user/entity/user.entity';
import { dayOfWeeks } from 'src/common/set/day-of-weeks';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { GetCalendarRequest } from './dto/request/get-calendar.request';
import { ServerException } from 'src/exception/custom-exception/server.exception';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(PromiseEntity)
    private readonly promiseRepository: Repository<PromiseEntity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Calendar)
    private readonly calendarRepository: Repository<Calendar>,
    @InjectRedis()
    private readonly redisClient: Redis,
  ) {}

  async getCalendar(userEmail: string, getCalendarRequest: GetCalendarRequest) {
    const { year, month } = getCalendarRequest;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    try {
      return {
        calendars: await this.calendarRepository
          .createQueryBuilder('calendar')
          .leftJoinAndSelect('calendar.successPromises', 'successPromise')
          .where('calendar.userEmail = :userEmail', { userEmail })
          .andWhere('calendar.date >= :startDate', { startDate })
          .andWhere('calendar.date < :endDate', { endDate })
          .getMany(),
      };
    } catch (error) {
      throw new ServerException();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async saveCalendar(qr: EntityManager) {
    const today = new Date(generateToday());
    const todayDay = dayOfWeeks[today.getDay()];

    const completePromisesUsers = await this.promiseRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.userEmail', 'userEmail')
      .where('p.promiseState = :state', {
        state: PromiseState.Completed.toString(),
      })
      .andWhere('find_in_set(:day, p.dayOfWeek)', { day: todayDay })
      .orWhere('p.dayOfWeek IS NULL')
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

      const diaryKey = `${user.email}_diary`;
      const diary = await this.redisClient.get(diaryKey);

      const completedPromises = await this.promiseRepository
        .createQueryBuilder('p')
        .select(['p.title AS title', 'p.dayOfWeek AS dayOfWeek', 'p.id AS id'])
        .where('p.userEmail = :userEmail', { userEmail })
        .andWhere('p.promiseState = :state', {
          state: PromiseState.Completed.toString(),
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where('find_in_set(:day, p.dayOfWeek)', {
              day: todayDay,
            }).orWhere('p.dayOfWeek IS NULL');
          }),
        )
        .getRawMany();

      if (!diary && completedPromises.length === 0) continue;

      const calendar = await qr.save(Calendar, {
        diary: diary ?? null,
        date: today,
        user: { email: user.email },
      });

      if (diary) {
        await this.redisClient.del(diaryKey);
      }

      for (const { title } of completedPromises) {
        await qr.save(SuccessPromise, {
          title,
          calendar: { id: calendar.id },
        });
      }

      for (const { id, dayOfWeek } of completedPromises) {
        if (!dayOfWeek) {
          await this.promiseRepository.delete(id);
        } else {
          await this.promiseRepository.update(id, {
            promiseState: PromiseState.NotCompleted,
          });
        }
      }
    }
  }
}
