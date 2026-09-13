import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const MakerId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.maker_id || request.maker?.id;
  },
);

export const CurrentMaker = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.maker;
  },
);
