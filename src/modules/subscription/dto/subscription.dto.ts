import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: '68d3a8c3b1c2d3e4f5a6b7c8',
    description: 'Plan ID',
  })
  @IsMongoId()
  @IsNotEmpty()
  planId: string;
}
