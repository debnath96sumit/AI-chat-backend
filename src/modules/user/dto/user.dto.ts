import { FileUploadDTO } from '@common/dto/common.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ChangePasswordDTO {
  @ApiProperty({ description: 'Old Password', required: true })
  @IsString({ message: 'Value must be a string' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'Old Password is required!' })
  oldPassword: string;

  @ApiProperty({ description: 'New Password', required: true })
  @IsString({ message: 'Value must be a string' })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: 'New Password is required!' })
  newPassword: string;
}

export class UpdateProfileApiDTO {
  @ApiPropertyOptional({ description: 'Full Name' })
  @IsString({ message: 'Value must be a string' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  fullName?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsString({ message: 'Value must be a string' })
  @IsOptional()
  @Transform(
    ({ value }: TransformFnParams) => value?.trim() && value?.toLowerCase(),
  )
  @IsEmail({}, { message: 'Please enter a valid email!' })
  email?: string;

  @ApiPropertyOptional({
    type: FileUploadDTO,
  })
  @IsOptional()
  profileImage?: FileUploadDTO;
}
