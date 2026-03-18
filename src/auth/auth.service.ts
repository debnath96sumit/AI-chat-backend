import { BadRequestException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CustomerEmailVerificationDTO, CustomerResetPasswordDTO, EmailDTO, RefreshJwtDto, SocialSignInDTO, UserSignInDTO, UserSignUpDTO } from './dto/auth.dto';
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
import { Redis } from "ioredis";
import { REDIS_CONNECTION } from "@common/redis/redis.provider";
import { MailerService } from "@helpers/mailer.helper";

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
        @Inject(REDIS_CONNECTION)
        private readonly redisHelper: Redis,
        private readonly userRepository: UserRepository,
        private readonly configService: ConfigService,
        private readonly roleRepository: RoleRepository,
        private readonly jwtService: JwtService,
        private readonly deviceHelper: DeviceHelper,
        private readonly userDeviceRepository: UserDeviceRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly mailerService: MailerService,
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

    async userSignUp(
        body: UserSignUpDTO,
        req: Request,
    ): Promise<ApiResponse> {
        const userRole = await this.roleRepository.getByField({
            role: 'user',
            isDeleted: false,
        });
        if (!userRole?._id) throw new BadRequestException("Invalid user role!");

        const isEmailExists = await this.userRepository.getByField({
            email: { $regex: "^" + body.email + "$", $options: "i" },
            isDeleted: false,
        });
        if (isEmailExists?._id)
            throw new BadRequestException("User with this email already exists!");

        const isMobileExists = await this.userRepository.getByField({
            phone: { $regex: "^" + body.phone + "$", $options: "i" },
            isDeleted: false,
        });
        if (isMobileExists?._id)
            throw new BadRequestException("User with this phone already exists!");

        let user = await this.userRepository.save({
            ...body,
            role: userRole._id,
        });

        const { accessToken, refreshToken } = await this.issueTokens(
            user,
            req,
        );

        return {
            statusCode: HttpStatus.CREATED,
            message: "User registered successfully!",
            data: {
                user,
                accessToken,
                refreshToken,
            },
        };
    }

    async loginUser(
        body: UserSignInDTO,
        req: Request,
    ): Promise<ApiResponse> {
        const checkIfExists = await this.userRepository.getByField({ email: body.email, isDeleted: false });

        if (!checkIfExists?._id) throw new BadRequestException("Invalid credentials!");

        if (!checkIfExists.validPassword(body.password)) {
            throw new BadRequestException("Invalid credentials!");
        }

        await this.userRepository.updateById(
            { rememberMe: body.rememberMe },
            checkIfExists?._id,
        );

        const { accessToken, refreshToken } = await this.issueTokens(checkIfExists, req);
        const userDetails = await this.userRepository.getUserDetails({ _id: checkIfExists._id });

        return {
            statusCode: HttpStatus.OK,
            message: "User login successful",
            data: {
                user: userDetails,
                accessToken,
                refreshToken,
            },
        };
    }

    async logoutUser(req: Request): Promise<ApiResponse> {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        await this.userDeviceRepository.updateByField(
            {
                isLoggedOut: true,
            },
            {
                accessToken: token,
            },
        );

        return {
            statusCode: HttpStatus.OK,
            message: "User logged out successfully",
        };
    }

    async refreshToken(body: RefreshJwtDto, req: Request): Promise<ApiResponse> {
        const authToken = body.accessToken;

        let tokenData = await this.userDeviceRepository.getByField({
            accessToken: authToken,
            isLoggedOut: false,
            isDeleted: false,
        });

        if (tokenData?._id) {
            const refreshTokenHash = await hash(
                body.accessToken.split(".")[2] + body.refreshToken,
                body.refreshToken,
            );

            const refreshTokenData = await this.refreshTokenRepository.getByField({
                hash: refreshTokenHash,
            });
            if (!refreshTokenData)
                throw new BadRequestException("Invalid token!");

            const user = await this.userRepository.getUserDetails({
                _id: new Types.ObjectId(refreshTokenData.userId),
                isDeleted: false,
                status: "Active",
            });
            if (!user?._id)
                throw new BadRequestException("User not found!");

            const expiresDate = new Date(refreshTokenData.createdAt);
            expiresDate.setSeconds(
                expiresDate.getSeconds() +
                (user.rememberMe
                    ? this.configService.getOrThrow<number>(
                        "JWT_REFRESH_EXPIRES_IN_REMEMBER",
                    )
                    : this.configService.getOrThrow<number>("JWT_REFRESH_EXPIRES_IN")),
            );
            if (new Date() > expiresDate) {
                await this.refreshTokenRepository.delete(refreshTokenData._id);
                throw new UnauthorizedException("Refresh token expired!");
            }

            const { accessToken, refreshToken } = await this.issueTokens(user, req);

            return {
                statusCode: HttpStatus.OK,
                message: "Refresh token issued successfully",
                data: { accessToken, refreshToken },
            };
        } else {
            throw new UnauthorizedException(
                "Token has been invalidated. Please log in again.",
            );
        }
    }

    async forgotPassword(body: EmailDTO): Promise<ApiResponse> {
        const user = await this.userRepository.getUserDetails({
            email: { $regex: `^${body.email}$`, $options: "i" },
            isDeleted: false,
        });

        if (!user?._id) {
            throw new BadRequestException("User with this email does not exist!");
        }

        const rateLimitKey = `forgot_password_limit:${body.email}`;
        const rateLimitCount = await this.redisHelper.get(rateLimitKey);

        if (rateLimitCount && parseInt(rateLimitCount) >= 3) {
            return {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message: "Too many requests. Please try again after 15 minutes.",
            };
        }

        const codeKey = `forgot_password_code:${body.email}`;
        const codeTimeKey = `forgot_password_time:${body.email}`;

        const lastRequestTime = await this.redisHelper.get(codeTimeKey);
        if (lastRequestTime && Date.now() - parseInt(lastRequestTime) < 60_000) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message:
                    "Please wait at least 1 minute before requesting a new code.",
            };
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        await this.redisHelper.set(
            codeKey,
            verificationCode.toString(),
            "EX",
            300,
        );
        await this.redisHelper.set(codeTimeKey, Date.now().toString(), "EX", 300);

        const currentCount = await this.redisHelper.incr(rateLimitKey);
        if (currentCount === 1) {
            await this.redisHelper.expire(rateLimitKey, 900); // 15 minutes
        }

        const locals = {
            site_logo_url: `${process.env.BACKEND_URL}/images/logo.png`,
            name: user.fullName,
            project_name: process.env.PROJECT_NAME || "AI Chat",
            code: verificationCode,
            current_year: new Date().getFullYear(),
        };

        await this.mailerService.sendMail(
            body.email,
            "AI Chat - Password Reset Verification Code",
            "forgot-password-email-verification",
            locals
        );

        return {
            statusCode: HttpStatus.OK,
            message: "A 4-digit verification code has been sent to your email.",
        };

    }

    async verifyEmail(
        body: CustomerEmailVerificationDTO
    ): Promise<ApiResponse> {
        const email = body.email.toLowerCase().trim();

        const user = await this.userRepository.getUserDetails({
            email: { $regex: `^${email}$`, $options: "i" },
            isDeleted: false,
        });

        if (!user?._id)
            throw new BadRequestException("User with this email does not exist!");

        const verificationKey = `forgot_password_code:${email}`;

        const storedCode = await this.redisHelper.get(verificationKey);

        if (!storedCode)
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: "Verification code expired or not found.",
            };

        if (storedCode !== body.code)
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: "Invalid verification code.",
            };

        await this.redisHelper.del(verificationKey);

        const verifiedKey = `forgot_password_verified:${email}`;
        await this.redisHelper.set(verifiedKey, "true", "EX", 600);

        return {
            statusCode: HttpStatus.OK,
            message: "Verification successful. You can now reset your password.",
        };
    }

    async resetPassword(
        body: CustomerResetPasswordDTO,
    ): Promise<ApiResponse> {
        const verifiedKey = `forgot_password_verified:${body.email}`;
        const isVerified = await this.redisHelper.get(verifiedKey);

        if (!isVerified) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                message: "Email not verified for password reset or session expired.",
            };
        }

        const user = await this.userRepository.getUserDetails({
            email: { $regex: `^${body.email}$`, $options: "i" },
            isDeleted: false,
        });

        if (!user?._id) {
            return {
                statusCode: HttpStatus.NOT_FOUND,
                message: "User not found.",
            };
        }

        await this.userRepository.updateById(
            { password: body.newPassword },
            user._id,
        );

        await this.redisHelper.del(verifiedKey);

        return {
            statusCode: HttpStatus.OK,
            message: "Password reset successfully. You can now log in.",
        };
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
            profileImage: { mediaId: null, url: userInfo.profileImage ?? null },
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

    async handleGithubLogin(githubUser: {
        githubId: string;
        email: string;
        firstName: string;
        lastName: string;
        profileImage: string;
    }, req: Request): Promise<{ token: string; refreshToken: string }> {

        let user = await this.userRepository.getByField({ githubId: githubUser.githubId });

        if (!user && githubUser.email) {
            user = await this.userRepository.getByField({ email: githubUser.email });
            if (user) {
                await this.userRepository.updateById(
                    { githubId: githubUser.githubId },
                    user._id
                );
            }
        }

        if (!user) {
            const userRole = await this.roleRepository.getByField({
                role: 'user',
                isDeleted: false,
            });
            if (!userRole?._id) throw new BadRequestException("Invalid user role!");
            user = await this.userRepository.save({
                githubId: githubUser.githubId,
                email: githubUser.email,
                firstName: githubUser.firstName,
                lastName: githubUser.lastName,
                fullName: `${githubUser.firstName} ${githubUser.lastName}`.trim(),
                profileImage: { mediaId: null, url: githubUser.profileImage },
                isAccountVerified: true,
                role: userRole._id,
            });
        }

        const { accessToken: token, refreshToken } = await this.issueTokens(
            user,
            req,
        );

        return {
            token,
            refreshToken,
        };
    }
}
