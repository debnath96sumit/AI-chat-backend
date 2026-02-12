import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SocialSignInDTO } from './dto/auth.dto';
import type { Request } from "express";

@ApiTags("Auth")
@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }


    @Post("social-signin")
    @HttpCode(200)
    async socialSignin(@Body() dto: SocialSignInDTO, @Req() req: Request) {
        return this.authService.socialSignin(dto, req);
    }

}
