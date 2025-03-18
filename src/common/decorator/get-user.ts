import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserEmail = createParamDecorator(
  (data, context: ExecutionContext): string => {
    const req = context.switchToHttp().getRequest();
    return req.user.email;
  },
);

