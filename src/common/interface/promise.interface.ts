import { PromiseState } from '../enum/promise-state';

export interface Promise {
  title: string;
  dayOfWeek: string;
  promiseState: PromiseState;
  createdAt: Date;
}
