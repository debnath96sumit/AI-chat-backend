import * as modelsConstant from '@modules/llm/constants/models.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AttachmentDto {
  @ApiProperty({
    description: 'Media document _id returned from /media/upload',
  })
  @IsMongoId()
  mediaId: string;

  @ApiProperty({ description: 'Public URL returned from /media/upload' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Original file name', example: 'resume.pdf' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ description: 'Mimetype', example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  mimetype: string;
}
export class SendMessageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chatId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Message must not be empty' })
  message: string;

  @ApiPropertyOptional({
    enum: ['groq', 'gemini', 'huggingface'],
    default: 'groq',
    description: 'LLM provider to use. Defaults to groq.',
  })
  @IsOptional()
  @IsEnum(['groq', 'gemini', 'huggingface'])
  provider?: modelsConstant.LLMProviderKey;

  @ApiPropertyOptional({
    description:
      "Model ID for the chosen provider. Defaults to provider's default model.",
    example: 'llama-3.3-70b-versatile',
  })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({
    description:
      'One attachment from a prior /media/upload call. Only one file per message supported.',
    type: AttachmentDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AttachmentDto)
  attachment?: AttachmentDto;
}

export class RenameChatDto {
  @ApiProperty({ example: 'Docker Deep Dive' })
  @IsString()
  title: string;
}
