import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FileUploadDTO {
  @ApiProperty({
    description: 'File ID',
    required: true,
  })
  @IsString({ message: 'File ID must be a string' })
  @IsNotEmpty({ message: 'File ID is required' })
  mediaId: string;

  @ApiProperty({
    description: 'File URL',
    required: true,
  })
  @IsString({ message: 'File URL must be a string' })
  @IsNotEmpty({ message: 'File URL is required' })
  url: string;
}
