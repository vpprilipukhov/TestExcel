import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { WordService } from '../word/word.service';

@Controller('api')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly wordService: WordService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Файл не предоставлен');
    }
    const result = await this.uploadService.processExcel(
      file.buffer,
      file.originalname,
    );
    return result;
  }

  @Get('files')
  async getFiles() {
    return this.uploadService.getFiles();
  }

  @Get('files/:id/rows')
  async getFileRows(@Param('id', ParseIntPipe) id: number) {
    return this.uploadService.getFileRows(id);
  }

  @Get('rows/:id/word')
  async generateWord(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const row = await this.uploadService.getRow(id);
    if (!row) {
      throw new NotFoundException('Строка не найдена');
    }
    const buffer = await this.wordService.generatePaymentRequirement(row);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="payment_requirement_${row.id}.docx"`,
    });
    res.send(buffer);
  }
}
