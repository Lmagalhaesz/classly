import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para extrair o endereço IP do cliente a partir do request.
 */
export const Ip = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return (
      request.headers['x-forwarded-for'] ||
      request.ip ||
      request.connection.remoteAddress ||
      'Unknown IP'
    );
  },
);