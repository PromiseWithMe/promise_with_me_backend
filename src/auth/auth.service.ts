import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterRequest } from './dto/request/register.request';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { UserAlreadyExistsException } from 'src/exception/custom-exception/user-already-exists.exception.ts';
import { ROLE } from 'src/common/enum/role';
import * as bcrypt from 'bcrypt';
import { TokensResponse } from './dto/response/tokens.response';
import { EnvKeys } from 'src/common/enum/env-keys';
import { LoginRequest } from './dto/request/login.reqeust';
import { LoginFailException } from 'src/exception/custom-exception/login-fail.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async _gereateToken(email: string) {
    return new TokensResponse(
      await this.jwtService.signAsync(
        { email: email, isRefresh: false },
        { secret: this.configService.get(EnvKeys.JWT_SECRET) },
      ),
      await this.jwtService.signAsync(
        { email: email, isRefresh: true },
        { secret: this.configService.get(EnvKeys.JWT_SECRET_REFRESH) },
      ),
    );
  }

  async register(registerRequest: RegisterRequest) {
    const { email, nickname, password } = registerRequest;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['email'],
    });
    if (user) throw new UserAlreadyExistsException();

    try {
      await this.userRepository.save({
        email,
        password: await bcrypt.hash(password, 10),
        nickname,
        role: ROLE.USER,
      });
    } catch (error) {
      throw error;
    }

    return this._gereateToken(email);
  }

  async login(loginRequest: LoginRequest) {
    const { email, password } = loginRequest;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['email', 'password'],
    });
    if(!user) throw new LoginFailException();

    if(!await bcrypt.compare(password, user.password)) {
      throw new LoginFailException();
    }

    return this._gereateToken(email);
  }
}
