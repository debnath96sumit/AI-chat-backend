import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/types/authenticated-user.type';

export const LoginUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
