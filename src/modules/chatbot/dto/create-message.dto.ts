import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @MinLength(1, { message: 'Message must not be empty' })
  message: string;
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
}

export class RenameChatDto {
  @ApiProperty({ example: 'Docker Deep Dive' })
  @IsString()
  title: string;
}