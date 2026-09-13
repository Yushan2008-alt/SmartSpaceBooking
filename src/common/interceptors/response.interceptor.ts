import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();

    // ponytail: bypass interceptor for swagger documentation routes
    if (req.url?.startsWith('/docs') || req.url?.startsWith('/favicon.ico')) {
      return next.handle();
    }

    const res = context.switchToHttp().getResponse();
    const statusCode = res.statusCode || 200;

    return next.handle().pipe(
      map((result) => {
        // If result already formatted with status: true
        if (result && typeof result === 'object' && 'status' in result && 'statusCode' in result) {
          return {
            status: result.status,
            statusCode: result.statusCode || statusCode,
            message: result.message || 'Berhasil',
            data: result.data !== undefined ? result.data : null,
            timestamp: result.timestamp || new Date().toISOString(),
          };
        }

        // Extract message and data if present, or use result directly as data
        let message = 'Berhasil';
        let data = result;

        if (result && typeof result === 'object' && !Array.isArray(result)) {
          if ('message' in result && 'data' in result) {
            message = result.message;
            data = result.data;
          } else if ('message' in result && Object.keys(result).length === 1) {
            message = result.message;
            data = null;
          }
        }

        return {
          status: true,
          statusCode,
          message,
          data: data !== undefined ? data : null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
