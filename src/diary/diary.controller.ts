import { Body, Controller, Get, Post } from '@nestjs/common';
import { GetUserEmail } from 'src/common/decorator/get-user';
import { DiaryService } from './diary.service';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  @Get()
  getDiary(@GetUserEmail() userEmail: string) {
    return this.diaryService.getDiary(userEmail);
  }

  @Post()
  setDiary(@GetUserEmail() userEmail: string, @Body('data') data: string) {
    return this.diaryService.setDiary(userEmail, data);
  }
}
