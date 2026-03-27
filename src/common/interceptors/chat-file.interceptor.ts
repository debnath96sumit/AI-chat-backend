import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SubscriptionService } from 'src/modules/subscription/subscription.service';
import { UsageService } from 'src/modules/usage/usage.service';

@Injectable()
export class ChatFileUploadInterceptor implements NestInterceptor {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly usageService: UsageService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const tier = await this.subscriptionService.getUserTier(user._id);
    await this.usageService.canUploadFile(user._id, tier);

    return next.handle().pipe(
      tap(async () => {
        await this.usageService.incrementFileUpload(user._id);
      }),
    );
  }
}
