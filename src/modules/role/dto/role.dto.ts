import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, TransformFnParams } from "class-transformer";

export class RoleListingDto {

  @ApiProperty({ default: 1 })
  @IsNumber()
  page?: number;

  @ApiProperty({ default: 10 })
  @IsNumber()
  limit?: number;

  @ApiProperty({ description: "Search...", required: false })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({ description: "Status Filter", required: false })
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty({ description: "Sort Field", required: false })
  @IsString()
  @IsOptional()
  sortField: string;

  @ApiProperty({
    description: "Sort Order",
    required: false,
    enum: ["asc", "desc"],
  })
  @IsString()
  @IsOptional()
  sortOrder: string;
}

export class SaveRoleDto {
  @ApiProperty({ description: "Role", required: true })
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Role is required" })
  role: string;

  @ApiProperty({ description: "Role Display Name", required: true })
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Role Display Name is required" })
  roleDisplayName: string;
}

export class UpdateRoleDto {
  @ApiProperty({ description: "Role", required: true })
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Role is required" })
  role: string;

  @ApiProperty({ description: "Role Display Name", required: true })
  @IsString()
  @Transform(({ value }: TransformFnParams) => value?.trim())
  @IsNotEmpty({ message: "Role Display Name is required" })
  roleDisplayName: string;

  @ApiProperty({ description: "Role Id", required: true })
  @IsString()
  @IsNotEmpty({ message: "Role Id is required" })
  id: string;
}
export class StatusRoleDto {
  @ApiProperty({
    description: "Status",
    required: true,
    enum: ["Active", "Inactive"],
  })
  @IsString()
  @IsNotEmpty({ message: "Status is required" })
  @Matches(/^(Active|Inactive)$/, {
    message: 'Status must be either "Active" or "Inactive"',
  })
  @Transform(({ value }: TransformFnParams) => value?.trim())
  status: string;

  @ApiProperty({ description: "Role Id", required: true })
  @IsString()
  @IsNotEmpty({ message: "Role Id is required" })
  id: string;
}
