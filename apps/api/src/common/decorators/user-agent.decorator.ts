import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o User-Agent do cliente a partir do request.
 */
export const UserAgent = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['user-agent'] || 'Unknown Browser';
  },
);