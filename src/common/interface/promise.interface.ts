import { PromiseState } from '../enum/promise-state';

export interface Promise {
  title: string;
  dayOfWeek: number[];
  promiseState: PromiseState;
  createdAt: Date;
}
