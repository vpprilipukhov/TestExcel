import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { WordService } from '../word/word.service';
import { FileUpload } from '../entities/file-upload.entity';
import { ExcelRow } from '../entities/excel-row.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileUpload, ExcelRow])],
  controllers: [UploadController],
  providers: [UploadService, WordService],
})
export class UploadModule {}
