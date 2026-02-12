import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from './strategy/auth.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtStrategy],
  exports: [JwtStrategy, AuthService]
})
export class AuthModule { }
