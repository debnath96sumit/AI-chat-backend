import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsNumber } from "class-validator";
import { Types } from "mongoose";

export class UserDeviceListingDto {
  @ApiProperty({ default: 1 })
  @IsNumber()
  page?: number;

  @ApiProperty({ default: 10 })
  @IsNumber()
  limit?: number;

  @IsOptional()
  user_id: string | Types.ObjectId;
}
