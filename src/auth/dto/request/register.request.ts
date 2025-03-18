import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RegisterRequest {
  @IsNotEmpty({ message: '이메일은 비어있을 수 없습니다.' })
  @IsEmail({}, { message: '이메일 형식으로 입력해주세요.' })
  email: string;

  @IsNotEmpty({ message: '비밀번호는 비어있을 수 없습니다.' })
  @IsString()
  password: string;

  @Length(1, 10, { message: '닉네임은 1~10자 사이로 입력해주세요.' })
  @IsNotEmpty({ message: '닉네임은 비어있을 수 없습니다.' })
  @IsString()
  nickname: string;
}
