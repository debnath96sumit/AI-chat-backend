import { ApiProperty } from "@nestjs/swagger";
import { Transform, TransformFnParams } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class ChangePasswordDTO {
    @ApiProperty({ description: "Old Password", required: true })
    @IsString({ message: "Value must be a string" })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: "Old Password is required!" })
    oldPassword: string;

    @ApiProperty({ description: "New Password", required: true })
    @IsString({ message: "Value must be a string" })
    @Transform(({ value }: TransformFnParams) => value?.trim())
    @IsNotEmpty({ message: "New Password is required!" })
    newPassword: string;
}
