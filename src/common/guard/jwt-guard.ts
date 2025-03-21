import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InvalidTokenFormatException } from 'src/exception/custom-exception/invalid-token-format.exception';
import { EnvKeys } from '../enum/env-keys';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';
import { Public } from '../decorator/public';
import { ROLE } from '../enum/role';
import { RBAC } from '../decorator/rbac';
import { IsRefresh } from '../decorator/is-refresh';

export class JwtGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (this.reflector.get(Public, context.getHandler())) {
      return true;
    }

    try {
      const rawToken = req.headers.authorization;
      if (!rawToken) throw new InvalidTokenFormatException();

      const [bearer, token] = rawToken.split(' ');
      if (bearer.toLowerCase() !== 'bearer')
        throw new InvalidTokenFormatException();

      const user = await this.userRepository.findOne({
        where: { email: this.jwtService.decode(token).email },
        select: ['email', 'role'],
      });
      if (!user) throw new InvalidTokenFormatException();

      const requiredRole = this.reflector.get<ROLE>(RBAC, context.getHandler());
      if (requiredRole !== undefined && user.role > requiredRole) {
        throw new InvalidTokenFormatException();
      }

      const secretKey = this.reflector.get(IsRefresh, context.getHandler())
        ? this.configService.get(EnvKeys.JWT_SECRET_REFRESH)
        : this.configService.get(EnvKeys.JWT_SECRET);

      req.user = await this.jwtService.verifyAsync(token, {
        secret: secretKey,
      });
    } catch (err) {
      throw new InvalidTokenFormatException();
    }

    return true;
  }
}
