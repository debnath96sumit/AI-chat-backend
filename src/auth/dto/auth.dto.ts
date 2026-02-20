import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, TransformFnParams } from "class-transformer";
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    Matches,
    MaxLength,
    MinLength,
} from "class-validator";


export class SocialSignInDTO {
    @ApiProperty({ description: "OAuth Token (ID Token)", required: true })
    @IsString({ message: "Value must be a string" })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: "OAuth Token is required!" })
    oauthToken: string;

    @ApiProperty({
        description: "Provider type",
        enum: ["google"],
        required: true,
    })
    @IsEnum(["google"], {
        message: "Provider must be either 'google'",
    })
    @IsNotEmpty({ message: "Provider is required!" })
    provider: "google";
}

export class UserSignInDTO {
    @ApiProperty({ description: "Email", required: true })
    @IsString({ message: "Value must be a string" })
    @Transform(
        ({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase(),
    )
    @IsNotEmpty({ message: "Email is required!" })
    email: string;

    @ApiProperty({ description: "Password", required: true })
    @IsString({ message: "Value must be a string" })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: "Password is required!" })
    @MinLength(8, { message: "Password must be at least 8 characters long" })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            "Password must contain uppercase, lowercase, and number/special character",
    })
    password: string;

    @ApiPropertyOptional({ description: "Device Token" })
    @IsOptional()
    // @IsNotEmpty({ message: "Device token should not be empty!" })
    @Transform(({ value }: TransformFnParams) =>
        typeof value === "string" ? value.trim() : String(value),
    )
    deviceToken?: string;

    @ApiPropertyOptional({ description: "Remember Me", default: false })
    @IsOptional()
    @Transform(({ value }) => value === "true" || value === true)
    rememberMe: boolean = false;
}

export class RefreshJwtDto {
    @ApiProperty({ description: "Access token to reach private urls" })
    @IsString()
    @IsNotEmpty({ message: "Access token is required!" })
    accessToken: string;

    @ApiProperty({ description: "Token to refresh whole pair" })
    @IsString()
    @IsNotEmpty({ message: "Refresh token is required!" })
    refreshToken: string;
}

export class UserSignUpDTO {
  @ApiProperty({ description: "Full Name", required: true })
  @IsString({ message: "Value must be a string" })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Full Name is required!" })
  @MinLength(3, { message: "Full Name must be at least 3 characters long" })
  @MaxLength(20, { message: "Full Name must be at most 20 characters long" })
  fullName: string;

  @ApiProperty({ description: "Email", required: true })
  @IsString({ message: "Value must be a string" })
  @Transform(
    ({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase(),
  )
  @IsEmail({}, { message: "Please enter a valid email!" })
  @IsNotEmpty({ message: "Email is required!" })
  email: string;

  @ApiProperty({ description: "Phone", required: true })
  @IsString({ message: "Value must be a string" })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Phone is required!" })
  @Matches(/^[0-9]+$/, {
    message: "Phone number should contain only numeric values",
  })
  @MinLength(10, {
    message: "Phone number must be at least 10 characters long",
  })
  @MaxLength(15, { message: "Phone number must be at most 15 characters long" })
  phone: string;

  @ApiProperty({ description: "Password", required: true })
  @IsString({ message: "Value must be a string" })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Password is required!" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "Password must contain uppercase, lowercase, and number/special character",
  })
  password: string;
}