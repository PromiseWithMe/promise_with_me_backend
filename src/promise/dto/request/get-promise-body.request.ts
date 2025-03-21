import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class GetPromiseBodyRequest {
  @IsNotEmpty()
  @IsOptional()
  @Min(0, { each: true, message: '0~6 내외의 숫자만을 리스트에 넣어주세요' })
  @Max(6, { each: true, message: '0~6 내외의 숫자만을 리스트에 넣어주세요' })
  dayOfWeek?: number[];
}
