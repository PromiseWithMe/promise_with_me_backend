import { Promise } from 'src/common/interface/promise.interface';
import { Promise as PromiseEntity } from 'src/promise/entity/promise.entity';

export class GetPromisesResponse {
  promises: Promise[];

  constructor(promises: PromiseEntity[]) {
    this.promises = promises.map((value) => {
      return {
        title: value.title,
        dayOfWeek: value.dayOfWeek
          ? value.dayOfWeek.split(',').map((value) => Number(value))
          : null,
        promiseState: value.promiseState,
      };
    });
  }
}
