import { Body, Controller, Get, HttpCode, Post, Req, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RefreshJwtDto, SocialSignInDTO, UserSignInDTO } from './dto/auth.dto';
import type { Request } from "express";
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Version('1')
    @Post("social-signin")
    @ApiOperation({ summary: "Social signin" })
    @ApiConsumes("application/json")
    @HttpCode(200)
    async socialSignin(@Body() dto: SocialSignInDTO, @Req() req: Request) {
        return this.authService.socialSignin(dto, req);
    }

    @Version('1')
    @Post("login-user")
    @ApiOperation({ summary: "User signin" })
    @ApiConsumes("application/json")
    @HttpCode(200)
    async loginUser(@Body() dto: UserSignInDTO, @Req() req: Request) {
        return this.authService.loginUser(dto, req);
    }

    @Version('1')
    @Get("logout-user")
    @HttpCode(200)
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    async logoutUser(@Req() req: Request) {
        return this.authService.logoutUser(req);
    }

    @Version('1')
    @Post("refresh-token")
    @HttpCode(200)
    @UseGuards(ThrottlerGuard)
    async refreshToken(@Body() dto: RefreshJwtDto, @Req() req: Request) {
        return this.authService.refreshToken(dto, req);
    }
}
