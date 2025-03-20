import { IsIn, IsNotEmpty } from 'class-validator';

export class ChangePromiseStateRequest {
  @IsNotEmpty({ message: '변경할 상태를 입력해주세요.' })
  @IsIn(['NotCompleted', 'Completed', 'Skip'], {
    message: 'NotCompleted, Completed, Skip내에서 상태를 결정해주세요',
  })
  promiseState: string;
}
