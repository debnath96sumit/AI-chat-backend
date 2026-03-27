import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserRepository } from '@modules/user/repositories/user.repository';
import { UserDeviceRepository } from '@modules/user-devices/repository/user-device.repository';
import { JwtPayloadType } from '@common/types/jwt.type';

@Injectable()
export class SseAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
    private userDeviceRepository: UserDeviceRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    let token = request.query?.token as string;

    if (!token) {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync<JwtPayloadType>(token, {
        secret: jwtSecret,
      });

      const tokenData = await this.userDeviceRepository.getByField({
        accessToken: token,
        expired: false,
        isLoggedOut: false,
        isDeleted: false,
      });

      if (!tokenData?._id) {
        throw new UnauthorizedException(
          'Token has been invalidated. Please log in again.',
        );
      }

      const user = await this.userRepository.getUserDetailsJwtAuth(payload.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request['user'] = user;

      return true;
    } catch (error) {
      // Token is invalid, expired, malformed, or revoked
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}
