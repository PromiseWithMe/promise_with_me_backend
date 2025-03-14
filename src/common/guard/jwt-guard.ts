import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InvalidTokenFormatException } from 'src/exception/custom-exception/invalid-token-format.exception';
import { EnvKeys } from '../enum/env-keys';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';

export class JwtGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const rawToken = req.headers.authorization;
    const [bearer, token] = rawToken.split(' ');

    if (bearer.toLowerCase() !== 'bearer') {
      throw new InvalidTokenFormatException();
    }

    const userEmail = await this.userRepository.findOne({
      where: { email: this.jwtService.decode(token).email },
      select: ['email'],
    });
    if(!userEmail) throw new InvalidTokenFormatException();

    try {
      req.user = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get(EnvKeys.JWT_SECRET_USER),
      });
    } catch (err) {
      throw new InvalidTokenFormatException();
    }

    return true;
  }
}

