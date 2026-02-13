import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { SocialSignInDTO } from './dto/auth.dto';
import { ApiResponse } from '@common/types/api-response.type';
import { UserRepository } from '@modules/user/repositories/user.repository';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { RoleRepository } from '@modules/role/repositories/role.repository';
import { JwtService } from '@nestjs/jwt';
import { DeviceHelper } from '@helpers/device.helper';
import { Types } from 'mongoose';
import { UserDeviceRepository } from '@modules/user-devices/repository/user-device.repository';
import { genSalt, hash } from 'bcrypt';
import { RefreshTokenRepository } from '@modules/refresh-token/repository/refresh-token.repository';
import { Request } from "express";

interface OathUserPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    emailVerified?: boolean;
    profileImage?: string;
    isAccountVerified?: boolean;
}

@Injectable()
export class AuthService {
    client: OAuth2Client;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService,
        private readonly roleRepository: RoleRepository,
        private readonly jwtService: JwtService,
        private readonly deviceHelper: DeviceHelper,
        private readonly userDeviceRepository: UserDeviceRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
    ) {
        this.client = new OAuth2Client(
            this.configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
        );
    }

    async socialSignin(
        body: SocialSignInDTO,
        req: Request,
    ): Promise<ApiResponse> {
        try {
            let userInfo: OathUserPayload;

            if (body.provider === "google") {
                userInfo = await this.verifyGoogleToken(body.oauthToken);
            } else {
                throw new Error("Unsupported provider");
            }

            if (!userInfo.email) {
                throw new Error(
                    `${body.provider} account does not have an email address`,
                );
            }

            const existUser = await this.userRepository.getUserDetails({
                email: { $regex: "^" + userInfo.email + "$", $options: "i" },
                isDeleted: false,
            });

            let user = existUser;

            if (!existUser) {
                user = await this.createSocialUser(userInfo, body.provider);
            }

            const { accessToken: token, refreshToken } = await this.issueTokens(
                user,
                req,
            );

            return {
                statusCode: HttpStatus.OK,
                message: "Login successful",
                data: {
                    user,
                    token,
                    refreshToken,
                },
            };
        } catch (error) {
            console.error(`${body.provider} Sign-In Error:`, error);
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message:
                    error instanceof Error ? error.message : "Authentication failed",
            };
        }
    }

    private async verifyGoogleToken(idToken: string): Promise<OathUserPayload> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error("Invalid Google token");
            }

            const { sub, email, name, picture, email_verified } = payload;
            if (!email) throw new Error("Email not found in Google token");
            if (!name) throw new Error("Name not found in Google token");
            const [first_name, last_name] = name
                ? name.split(" ")
                : ["John", "Smith"];

            return {
                id: sub,
                email,
                firstName: first_name,
                lastName: last_name,
                fullName: name,
                emailVerified: email_verified,
                isAccountVerified: email_verified,
                profileImage: picture ?? undefined,
            };
        } catch (error) {
            console.error("Google token verification error:", error);
            throw new Error("Failed to verify Google token");
        }
    }

    private async createSocialUser(
        userInfo: OathUserPayload,
        provider: string,
    ): Promise<any> {
        const userRole = await this.roleRepository.getByField({
            role: "user",
            isDeleted: false,
        });

        if (!userRole) {
            throw new BadRequestException("User role not found");
        }

        const user_payload: any = {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            fullName: userInfo.fullName,
            email: userInfo.email,
            password: 'Password@123',
            role: userRole._id,
            isAccountVerified: userInfo.emailVerified !== false,
            profileImage: userInfo.profileImage ?? null,
            googleId: provider === "google" ? userInfo.id : null,
        };

        const saveUser = await this.userRepository.save(user_payload);
        if (!saveUser || !saveUser._id) {
            throw new BadRequestException("Failed to create user account");
        }

        return await this.userRepository.getUserDetails({ _id: saveUser._id });
    }

    async issueTokens(user: any, req: Request, deviceToken?: string) {
        const payload = { id: user._id, role: user.role };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.getOrThrow("JWT_SECRET"),
            expiresIn: this.configService.getOrThrow("JWT_ACCESS_EXPIRES_IN"),
        });

        const refreshToken = await this.generateRefreshToken(accessToken, user._id);

        await this.deviceHelper.saveOrUpdateDeviceInfo(
            req,
            user._id.toString(),
            accessToken,
            deviceToken,
        );

        this.invalidAccessToken(user._id);

        return { accessToken, refreshToken };
    }

    async invalidAccessToken(user: Types.ObjectId): Promise<boolean> {
        let tokenDatas = await this.userDeviceRepository.getAllByField({
            user_id: user,
            expired: false,
            isDeleted: false,
        });

        await Promise.all(
            tokenDatas.map(async (tokenDoc) => {
                try {
                    this.jwtService.verify(tokenDoc.accessToken, {
                        secret: this.configService.getOrThrow("JWT_SECRET"),
                    });
                } catch (err) {
                    await this.userDeviceRepository.updateById(
                        { expired: true },
                        tokenDoc._id,
                    );
                }
            }),
        );

        return true;
    }

    async generateRefreshToken(
        accessToken: string,
        user: string | Types.ObjectId,
    ): Promise<string> {
        const salt = await genSalt(10);
        const hashedToken = await hash(accessToken.split(".")[2] + salt, salt);
        await this.refreshTokenRepository.upsert(
            { userId: user },
            {
                hash: hashedToken,
            },
        );
        return salt;
    }
}
