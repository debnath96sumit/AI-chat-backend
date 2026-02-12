import { ApiProperty } from "@nestjs/swagger";
import { Transform, TransformFnParams } from "class-transformer";
import {
    IsEnum,
    IsNotEmpty,
    IsString,
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
