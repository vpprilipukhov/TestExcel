import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadModule } from './upload/upload.module';
import { FileUpload } from './entities/file-upload.entity';
import { ExcelRow } from './entities/excel-row.entity';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: path.join(process.cwd(), 'data.db'),
      entities: [FileUpload, ExcelRow],
      synchronize: true,
    }),
    UploadModule,
  ],
})
export class AppModule {}
