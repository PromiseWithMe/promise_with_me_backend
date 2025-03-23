import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserEmail = createParamDecorator(
  (data, context: ExecutionContext): string => {
    const contextType = context.getType();

    if (contextType === 'http') {
      const req = context.switchToHttp().getRequest();
      return req.user.email;
    } else if (contextType === 'ws') {
      const req = context.switchToWs().getClient();
      return req.data.user.email;
    }
  },
);
