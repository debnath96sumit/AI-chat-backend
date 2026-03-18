import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from './strategy/auth.strategy';
import { SseAuthGuard } from './guards/sse-auth.guard';
import { GithubStrategy } from './strategy/github.strategy';
import { GithubAuthGuard } from './guards/github-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtStrategy, SseAuthGuard, GithubStrategy, GithubAuthGuard],
  exports: [JwtStrategy, AuthService, SseAuthGuard, JwtService, GithubStrategy, GithubAuthGuard],
})
export class AuthModule { }
