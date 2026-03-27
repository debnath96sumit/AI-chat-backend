import { ApiProperty } from '@nestjs/swagger';

export class SingleFileUploadDTO {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;
}

export class MultipleFileUploadDTO {
  @ApiProperty({
    description: 'Multiple files to upload',
    type: 'string',
    format: 'binary',
    isArray: true,
  })
  files: any[];
}
