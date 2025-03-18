import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterRequest } from './dto/request/register.request';
import { Public } from 'src/common/decorator/public';
import { LoginRequest } from './dto/request/login.reqeust';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() registerRequest: RegisterRequest) {
    return this.authService.register(registerRequest);
  }

  @Public()
  @Get('login')
  login(@Body() loginRequest: LoginRequest) {
    return this.authService.login(loginRequest);
  }
}
