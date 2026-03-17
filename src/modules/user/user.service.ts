import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { AuthenticatedUser } from '@auth/types/authenticated-user.type';
import { ApiResponse } from '@common/types/api-response.type';
import mongoose from 'mongoose';
import { ChangePasswordDTO, UpdateProfileApiDTO } from './dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { MediaRepository } from '@modules/media/repositories';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class UserService {

    constructor(
        private userRepository: UserRepository,
        private readonly configService: ConfigService,
        private readonly mediaRepository: MediaRepository,
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

    async userUpdateProfile(
        body: UpdateProfileApiDTO,
        user: AuthenticatedUser,
    ): Promise<ApiResponse> {
        if (!user) {
            throw new NotFoundException("User not found!");
        }

        const userData = await this.userRepository.getById(user._id);

        if (userData && userData._id) {
            if (body.email) {
                body.email = body.email.toLowerCase().trim();

                if (body.email !== userData.email) {
                    const checkEmailAvailable = await this.userRepository.getByField({
                        _id: { $ne: userData._id },
                        email: { $regex: "^" + body.email + "$", $options: "i" },
                        isDeleted: false,
                    });
                    if (checkEmailAvailable && checkEmailAvailable._id) {
                        throw new BadRequestException(
                            "User already exists with this email account",
                        );
                    }
                }
            }

            if (body.profileImage) {
                // Check if user already has a profile image
                if (userData.profileImage && userData.profileImage.mediaId) {
                    // Only delete old image if the new media ID is different from the existing one
                    if (userData.profileImage.mediaId.toString() !== body.profileImage.mediaId.toString()) {
                        await this.mediaRepository.updateByField(
                            { isDeleted: true },
                            { _id: new mongoose.Types.ObjectId(userData.profileImage.mediaId) },
                        );

                        // Extract relative path from the stored URL and unlink the file
                        const backend_url = this.configService.get("BACKEND_URL");
                        const extract_path = userData.profileImage.url.replace(
                            `${backend_url}/`,
                            "",
                        );

                        if (existsSync(`public/${extract_path}`)) {
                            unlinkSync(`public/${extract_path}`);
                        }
                    }
                }
            }
            const updateData = {
                fullName: body.fullName ?? userData.fullName,
                email: body.email ?? userData.email,
                profileImage: body.profileImage ?? userData.profileImage,
            }
            const updateUser = await this.userRepository.updateById(
                updateData,
                userData._id,
            );

            return {
                statusCode: updateUser ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
                message: updateUser ? "Profile updated successfully!" : "Unable to update profile at this moment.",
                data: updateUser ?? {},
            };
        }

        throw new BadRequestException(
            "Oops, no user found. Kindly proceed to signup",
        );
    }
}
