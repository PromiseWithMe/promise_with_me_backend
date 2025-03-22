import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreatePromiseRequest {
  @IsNotEmpty({ message: '약속의 이름을 지어주세요' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: '날짜 형식을 지정해주세요' })
  @IsNumber({}, { each: true, message: 'List는 숫자로만 이루어져야 합니다.' })
  @Min(0, { each: true, message: '0~6 내외의 숫자만을 리스트에 넣어주세요' })
  @Max(6, { each: true, message: '0~6 내외의 숫자만을 리스트에 넣어주세요' })
  @Transform(({ value }) => value.sort())
  dayOfWeek: number[];
}
