import { IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @IsString()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  @MinLength(1, { message: 'Message must not be empty' })
  message: string;
}
