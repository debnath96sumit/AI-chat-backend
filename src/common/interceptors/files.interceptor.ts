import { BadRequestException } from "@nestjs/common";
import { FilesInterceptor, FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { existsSync, mkdirSync } from "fs";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from 'uuid';

export const normalizeFilename = (str: string): string => {
  const originalName = str.replace(/\s/g, "_");
  const extension = originalName.split(".").pop();
  const timestamp = Date.now();

  if (!extension) {
    throw new Error("Failed to determine file extension");
  }

  return `${timestamp}_${originalName}`;
};

export const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/pdf",
  "text/csv",
  "video/mp4",
  "video/mpeg",
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
];
const allowedExtensions = [
  ".jpeg",
  ".jpg",
  ".png",
  ".gif",
  ".pdf",
  ".csv",
  ".mp4",
  ".xls",
  ".xlsx",
];

const CHAT_ALLOWED_MIMETYPES = ['application/pdf', 'text/plain'];
const CHAT_ALLOWED_EXTENSIONS = ['.pdf', '.txt'];
const CHAT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const SingleFileInterceptor = (directory: string, fieldName: string) =>
  FileInterceptor(fieldName, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    storage: diskStorage({
      destination(_req: Request, _file: Express.Multer.File, callback) {
        if (!existsSync("./public")) mkdirSync("./public");
        if (!existsSync("./public/uploads")) mkdirSync("./public/uploads");
        if (!existsSync(`./public/uploads/${directory}`))
          mkdirSync(`./public/uploads/${directory}`);

        callback(null, `./public/uploads/${directory}`);
      },
      filename(_req, file, callback) {
        callback(null, normalizeFilename(file.originalname));
      },
    }),
    fileFilter(_req, file, callback) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(`Unsupported file type: ${file.mimetype}.`),
          false,
        );
      }

      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return callback(new Error("Invalid file extension!"), false);
      }

      callback(null, true);
    },
  });

export const MultiFileInterceptor = (
  directory: string,
  fieldName: string,
  maxFiles: number = 25,
) =>
  FilesInterceptor(fieldName, maxFiles, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    storage: diskStorage({
      destination(_req: Request, _file: Express.Multer.File, callback) {
        if (!existsSync("./public")) mkdirSync("./public");
        if (!existsSync("./public/uploads")) mkdirSync("./public/uploads");
        if (!existsSync(`./public/uploads/${directory}`))
          mkdirSync(`./public/uploads/${directory}`);

        callback(null, `./public/uploads/${directory}`);
      },
      filename(_req, file, callback) {
        callback(null, normalizeFilename(file.originalname));
      },
    }),
    fileFilter(_req, file, callback) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(`Unsupported file type: ${file.mimetype}`),
          false,
        );
      }

      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return callback(new Error("Invalid file extension!"), false);
      }

      callback(null, true);
    },
  });


export const ChatFileInterceptor = (directory: string, fieldName: string) =>
  FileInterceptor(fieldName, {
    limits: {
      fileSize: CHAT_MAX_FILE_SIZE_BYTES,
    },
    storage: diskStorage({
      destination(_req: Request, _file: Express.Multer.File, callback) {
        if (!existsSync("./public")) mkdirSync("./public");
        if (!existsSync("./public/uploads")) mkdirSync("./public/uploads");
        if (!existsSync(`./public/uploads/${directory}`))
          mkdirSync(`./public/uploads/${directory}`);

        callback(null, `./public/uploads/${directory}`);
      },
      filename(_req, file, callback) {
        callback(null, normalizeFilename(file.originalname));
      },
    }),
    fileFilter(_req, file, callback) {
      if (!CHAT_ALLOWED_MIMETYPES.includes(file.mimetype)) {
        return callback(
          new BadRequestException(`Unsupported file type: ${file.mimetype}.`),
          false,
        );
      }

      const ext = extname(file.originalname).toLowerCase();
      if (!CHAT_ALLOWED_EXTENSIONS.includes(ext)) {
        return callback(new Error("Invalid file extension!"), false);
      }

      callback(null, true);
    },
  });
