import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

// pdf-parse is a CommonJS module — import this way to avoid ESM issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

const MAX_EXTRACTED_CHARS = 12000;

@Injectable()
export class FileExtractionService {
  private readonly logger = new Logger(FileExtractionService.name);

  async extractText(filePath: string, mimetype: string): Promise<string> {
    const ext = extname(filePath).toLowerCase();

    try {
      if (mimetype === 'text/plain' || ext === '.txt') {
        return this.extractFromTxt(filePath);
      }

      if (mimetype === 'application/pdf' || ext === '.pdf') {
        return await this.extractFromPdf(filePath);
      }

      throw new BadRequestException(
        `Unsupported file type: ${mimetype}. Supported types: PDF, TXT`,
      );
    } catch (error) {
      console.log(error);

      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Failed to extract text from ${filePath}:`,
        error.message,
      );
      throw new BadRequestException(
        'Failed to read file content. Please try again.',
      );
    }
  }

  private extractFromTxt(filePath: string): string {
    const content = readFileSync(filePath, 'utf-8');
    return this.truncate(content);
  }

  private async extractFromPdf(filePath: string): Promise<string> {
    const buffer = readFileSync(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });

    try {
      const result = await parser.getText();

      if (!result.text?.trim()) {
        throw new BadRequestException(
          'Could not extract text from this PDF. It may be scanned or image-based.',
        );
      }

      return this.truncate(result.text);
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  private truncate(text: string): string {
    const cleaned = text
      .replace(/\r\n/g, '\n') // normalize line endings
      .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
      .trim();

    if (cleaned.length <= MAX_EXTRACTED_CHARS) return cleaned;

    this.logger.warn(
      `File content truncated from ${cleaned.length} to ${MAX_EXTRACTED_CHARS} chars`,
    );

    return (
      cleaned.slice(0, MAX_EXTRACTED_CHARS) +
      '\n\n[Content truncated due to length limit]'
    );
  }
}
