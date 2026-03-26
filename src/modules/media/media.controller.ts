import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  Param,
  UploadedFile,
  Delete,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import {
  SingleFileInterceptor,
  MultiFileInterceptor,
  ChatFileInterceptor,
} from "@common/interceptors/files.interceptor";
import { MediaService } from "./media.service";
import { SingleFileUploadDTO, MultipleFileUploadDTO } from "./dto/media.dto";
import { AuthGuard } from "@nestjs/passport";
import { ChatFileUploadInterceptor } from "@common/interceptors/chat-file.interceptor";

@ApiTags("Media")
@Controller({ path: "media", version: "1" })
export class MediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Post("upload-single-file")
  @HttpCode(200)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(SingleFileInterceptor("file", "file"))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SingleFileUploadDTO,
  ) {
    return await this.mediaService.uploadSingleFile(file, dto);
  }

  @Post("upload-chat-file")
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    ChatFileUploadInterceptor,
    ChatFileInterceptor("chat-files", "file")
  )
  async uploadChatFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SingleFileUploadDTO
  ) {
    return await this.mediaService.uploadSingleFile(file, dto);
  }

  @Post("upload-multiple-file")
  @HttpCode(200)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(MultiFileInterceptor("file", "files"))
  async uploadMultipleFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: MultipleFileUploadDTO,
  ) {
    return await this.mediaService.uploadMultipleFiles(files, dto);
  }

  @Delete("delete/:id")
  // @UseGuards(AuthGuard("jwt"))
  // @ApiBearerAuth()
  @ApiConsumes("application/json")
  async delete(@Param("id") id: string) {
    return await this.mediaService.delete(id);
  }
}
