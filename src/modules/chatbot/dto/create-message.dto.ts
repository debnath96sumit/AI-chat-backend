import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  chatId?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Message must not be empty' })
  message: string;
}

export class RenameChatDto {
  @ApiProperty({ example: 'Docker Deep Dive' })
  @IsString()
  title: string;
}