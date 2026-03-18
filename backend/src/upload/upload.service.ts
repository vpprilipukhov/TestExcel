import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUpload } from '../entities/file-upload.entity';
import { ExcelRow } from '../entities/excel-row.entity';
import * as XLSX from 'xlsx';

// Excel column headers in order — maps to entity fields
const COLUMN_KEYS: (keyof ExcelRow | null)[] = [
  'cardindexId',
  'clientId',
  'offBalanceAccount',
  'cardIndexType1',
  'clientName',
  'cardIndexType2',
  'documentNumber',
  'status',
  'documentDate',
  'processingDate',
  'documentAmount',
  'paymentBalance',
  'currencyCode',
  'currency',
  'operationType',
  'paymentPurpose',
  'paymentPriority',
  'payerKpp',
  'payerInn',
  'payerName',
  'payerCorrAccount',
  'payerBankBik',
  'payerBank',
  'payerAccount',
  'kpp',
  'recipientInn',
  'recipientBank',
  'recipientCorrAccount',
  'recipientBik',
  'recipientBankName',
  'recipientAccount',
  'deliveryType',
  'accountNumberDt',
  'accountNumberKt',
  'docCardIndexEksId',
  'sourceFactory',
  'textReturn',
  'loadDate',
];

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(FileUpload)
    private fileUploadRepo: Repository<FileUpload>,
    @InjectRepository(ExcelRow)
    private excelRowRepo: Repository<ExcelRow>,
  ) {}

  async processExcel(
    buffer: Buffer,
    originalName: string,
  ): Promise<FileUpload> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    // Skip header row (index 0) and optional number row (index 1 if it starts with "Номер")
    let dataStartIndex = 1;
    if (
      rawData.length > 1 &&
      String(rawData[1][0] ?? '')
        .toLowerCase()
        .includes('номер')
    ) {
      dataStartIndex = 2;
    }

    const dataRows = rawData.slice(dataStartIndex).filter((row) =>
      row.some((cell) => cell !== ''),
    );

    // Create file upload record
    const fileUpload = this.fileUploadRepo.create({
      originalName,
      rowCount: dataRows.length,
      uploadedBy: 'user',
    });
    const savedFile = await this.fileUploadRepo.save(fileUpload);

    // Create excel rows
    const excelRows: ExcelRow[] = dataRows.map((row) => {
      const entity = this.excelRowRepo.create({ fileUploadId: savedFile.id });
      COLUMN_KEYS.forEach((key, idx) => {
        if (key && idx < row.length) {
          (entity as any)[key] = String(row[idx] ?? '');
        }
      });
      return entity;
    });

    if (excelRows.length > 0) {
      await this.excelRowRepo.save(excelRows);
    }

    return savedFile;
  }

  async getFiles(): Promise<FileUpload[]> {
    return this.fileUploadRepo.find({
      order: { uploadedAt: 'DESC' },
    });
  }

  async getFileRows(fileId: number): Promise<ExcelRow[]> {
    return this.excelRowRepo.find({
      where: { fileUploadId: fileId },
      order: { id: 'ASC' },
    });
  }

  async getRow(rowId: number): Promise<ExcelRow | null> {
    return this.excelRowRepo.findOne({ where: { id: rowId } });
  }
}
