import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class GetCalendarRequest {
  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;
}
