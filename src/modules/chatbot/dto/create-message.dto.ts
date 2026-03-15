import * as modelsConstant from '@modules/llm/constants/models.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

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
    description: 'Model ID for the chosen provider. Defaults to provider\'s default model.',
    example: 'llama-3.3-70b-versatile',
  })
  @IsOptional()
  @IsString()
  modelId?: string;
}

export class RenameChatDto {
  @ApiProperty({ example: 'Docker Deep Dive' })
  @IsString()
  title: string;
}