import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { ApiResponse } from '@common/types/api-response.type';
import mongoose from 'mongoose';
import { ChangePasswordDTO } from './dto/user.dto';

@Injectable()
export class UserService {

    constructor(
        private userRepository: UserRepository,
    ) { }
    async profileDetails(user: AuthenticatedUser): Promise<ApiResponse> {
        if (!user) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "Profile details not found.",
            };
        }

        const userDetails = await this.userRepository.getUserDetails({
            _id: new mongoose.Types.ObjectId(user._id),
            isDeleted: false,
        });

        return userDetails
            ? {
                statusCode: HttpStatus.OK,
                message: "Profile details retrieved successfully.",
                data: userDetails,
            }
            : {
                statusCode: HttpStatus.NOT_FOUND,
                message: "Profile details not found.",
            };
    }

    async userChangePassword(
        body: ChangePasswordDTO,
        user: AuthenticatedUser,
    ): Promise<any> {
        if (!user) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "Profile details not found.",
            };
        }

        let userData = await this.userRepository.getById(user._id);
        if (!userData) throw new NotFoundException("User not found!");

        if (
            !userData.validPassword(body.oldPassword)
        ) {
            throw new BadRequestException("Sorry old password mismatch!");
        }

        let userUpdate = await this.userRepository.updateById(
            {
                password: body.newPassword,
            },
            user._id,
        );

        return {
            statusCode: userUpdate ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
            message: userUpdate ? "Your password has been updated successfully." : "Unable to change password at this moment.",
            data: {},
        };

    }
}
