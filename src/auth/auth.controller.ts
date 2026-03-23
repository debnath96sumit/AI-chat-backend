import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CustomerEmailVerificationDTO, CustomerResetPasswordDTO, EmailDTO, RefreshJwtDto, SocialSignInDTO, UserSignInDTO, UserSignUpDTO } from './dto/auth.dto';
import type { Request, Response } from "express";
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags("Auth")
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService, private readonly configService: ConfigService) { }

    @Version('1')
    @Post("social-signin")
    @ApiOperation({ summary: "Social signin" })
    @ApiConsumes("application/json")
    @HttpCode(200)
    async socialSignin(@Body() dto: SocialSignInDTO, @Req() req: Request) {
        return this.authService.socialSignin(dto, req);
    }

    @Version('1')
    @Post("register")
    @UseGuards(ThrottlerGuard)
    @ApiOperation({ summary: "User registration" })
    @ApiConsumes("application/json")
    @HttpCode(200)
    async registerUser(@Body() dto: UserSignUpDTO, @Req() req: Request) {
        return this.authService.userSignUp(dto, req);
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
    async refreshToken(@Body() dto: RefreshJwtDto) {
        return this.authService.refreshToken(dto);
    }

    @Version('1')
    @Post("forgot-password")
    @ApiConsumes("application/json")
    async forgotPassword(@Body() dto: EmailDTO) {
        return await this.authService.forgotPassword(dto);
    }

    @Version('1')
    @Post("verify-email")
    @ApiConsumes("application/json")
    async verifyEmail(
        @Body() dto: CustomerEmailVerificationDTO
    ) {
        return await this.authService.verifyEmail(dto);
    }

    @Version('1')
    @Post("reset-password")
    @ApiConsumes("application/json")
    async resetPassword(@Body() dto: CustomerResetPasswordDTO) {
        return await this.authService.resetPassword(dto);
    }

    @Version('1')
    @Get('github')
    @UseGuards(GithubAuthGuard)
    @ApiOperation({ summary: 'Start GitHub OAuth flow' })
    async githubLogin() {
        // This route will be handled by the guard
    }

    @Version('1')
    @Get('github/callback')
    @UseGuards(GithubAuthGuard)
    @ApiOperation({ summary: 'GitHub OAuth callback' })
    async githubCallback(@Req() req: Request, @Res() res: Response) {
        const { token, refreshToken } = await this.authService.handleGithubLogin(req.user as any, req);
        return res.redirect(
            `${this.configService.get('FRONTEND_URL')}/auth/github/callback?token=${token}&refreshToken=${refreshToken}`
        );
    }
}
