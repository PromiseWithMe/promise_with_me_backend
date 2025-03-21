import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, from, Observable, tap } from 'rxjs';
import { ServerException } from 'src/exception/custom-exception/server.exception';
import { HttpException } from 'src/exception/http.exception';
import { DataSource } from 'typeorm';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    req.queryRunnerManager = queryRunner.manager;

    return next.handle().pipe(
      catchError((e) =>
        from(
          (async () => {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw e instanceof HttpException || e instanceof BadRequestException
              ? e
              : new ServerException();
          })(),
        ),
      ),
      tap(async () => {
        try {
          await queryRunner.commitTransaction();
        } finally {
          await queryRunner.release();
        }
      }),
    );
  }
}
