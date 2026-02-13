import { Controller, Get, UseGuards, Version, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginUser } from '@common/decorator/login-user.decorator';
import type { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { ChangePasswordDTO } from './dto/user.dto';

@ApiTags("User")
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Version("1")
    @Get("profile-details")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    @ApiConsumes("application/json")
    async apiProfileDetails(
        @LoginUser() user: AuthenticatedUser,
    ) {
        return this.userService.profileDetails(user);
    }

    @Version("1")
    @Post("change-password")
    @UseGuards(AuthGuard("jwt"))
    @ApiBearerAuth()
    @ApiConsumes("application/json")
    async userChangePassword(
        @Body() dto: ChangePasswordDTO,
        @LoginUser() user: AuthenticatedUser,
    ) {
        return await this.userService.userChangePassword(dto, user);
    }
}
