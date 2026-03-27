import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiResponse } from 'src/common/types/api-response.type';
import { MediaRepository } from './repositories/media.repository';
import { SingleFileUploadDTO, MultipleFileUploadDTO } from './dto/media.dto';
import { Types } from 'mongoose';
import { existsSync, unlinkSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { MediaDocument } from './schemas/media.schema';

@Injectable()
export class MediaService {
  constructor(
    private mediaRepository: MediaRepository,
    private configService: ConfigService,
  ) {}

  async uploadSingleFile(
    file: any,
    dto: SingleFileUploadDTO,
  ): Promise<ApiResponse> {
    if (!file) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Please upload a file.',
      };
    }

    const backend_url = this.configService.get('BACKEND_URL');
    const folderPath = file.destination.replace('./public/uploads/', '');
    const mediaData = {
      originalName: file.originalname,
      fileName: file.filename,
      folder: folderPath,
      mimetype: file.mimetype,
      encoding: file.encoding || '',
      size: file.size,
      url: `${backend_url}/uploads/${folderPath}/${file.filename}`,
      path: file.path,
    };

    let saveFile = await this.mediaRepository.save(mediaData);
    if (saveFile && saveFile._id) {
      return {
        statusCode: HttpStatus.OK,
        message: 'File uploaded successfully.',
        data: saveFile,
      };
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong.',
      };
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: MultipleFileUploadDTO,
  ): Promise<ApiResponse> {
    if (!files || files.length === 0) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Please upload at least one file.',
      };
    }
    console.log('dto', dto, files);

    const backend_url = this.configService.get('BACKEND_URL');
    const savedFiles: MediaDocument[] = [];

    for (const file of files) {
      const folderPath = file.destination.replace('./public/uploads/', '');

      const mediaData = {
        originalName: file.originalname,
        fileName: file.filename,
        folder: folderPath,
        mimetype: file.mimetype,
        encoding: file.encoding || '',
        size: file.size,
        url: `${backend_url}/uploads/${folderPath}/${file.filename}`,
        path: file.path,
      };

      const saved = await this.mediaRepository.save(mediaData);
      savedFiles.push(saved);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Files uploaded successfully.',
      data: savedFiles,
    };
  }

  async delete(id: string): Promise<ApiResponse> {
    const mediaDetails = await this.mediaRepository.getById(
      new Types.ObjectId(id),
    );

    if (!mediaDetails) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'File not found.',
      };
    }

    if (mediaDetails.path) {
      const path = mediaDetails.path;
      if (existsSync(path)) {
        unlinkSync(path);
      }
    }

    let deleteFile = await this.mediaRepository.updateById(
      { isDeleted: true },
      new Types.ObjectId(id),
    );
    if (deleteFile && deleteFile._id) {
      return {
        statusCode: HttpStatus.OK,
        message: 'File deleted successfully.',
        data: deleteFile,
      };
    } else {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Something went wrong.',
      };
    }
  }
}
