import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadService } from '../src/upload/upload.service';
import { FileUpload } from '../src/entities/file-upload.entity';
import { ExcelRow } from '../src/entities/excel-row.entity';
import * as XLSX from 'xlsx';

function createTestExcelBuffer(rows: string[][]): Buffer {
  const headers = [
    'cardindex_id', 'client_id', 'Внебалансовый счет', 'Вид картотеки',
    'Наименование клиента', 'Вид картотеки', 'Номер документа', 'Статус',
    'Дата документа', 'Дата обработки документа', 'Сумма документа',
    'Остаток платежа', 'Код валюты', 'Валюта', 'Вид операции',
    'Назначение платежа', 'Очередность платежа', 'payerkpp',
    'ИНН плательщика', 'Наименование плательщика', 'Кор. счет плательщика',
    'БИК банка плательщика', 'Банк плательщика', 'Счет плательщика', 'КПП',
    'ИНН получателя', 'Банк получателя', 'Кор счет получателя',
    'БИК получателя', 'Наименование Банка получателя', 'Счет получателя',
    'deliverytype', 'accountnumberdt', 'accountnumberkt',
    'doccardindexeksid', 'sourcefactory', 'textreturn', 'load_date',
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

const TEST_ROW = [
  '1', 'C001', '40817', '2', 'ООО Тест', '2', '12345', 'Active',
  '01.01.2025', '02.01.2025', '150000.00', '50000.00', '643', 'RUB', '01',
  'Оплата по договору №123', '5', '770101001', '7701234567',
  'ООО Плательщик', '30101810400000000225', '044525225', 'ПАО Сбербанк',
  '40702810938000012345', '770201001', '7709876543', 'АО Альфа-Банк',
  '30101810200000000593', '044525593', 'АО Альфа-Банк',
  '40702810100000054321', 'электронно', '', '', '', '', '', '2025-01-01',
];

describe('UploadService', () => {
  let service: UploadService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [FileUpload, ExcelRow],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([FileUpload, ExcelRow]),
      ],
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should parse Excel and create FileUpload with correct row count', async () => {
    const buffer = createTestExcelBuffer([TEST_ROW]);
    const result = await service.processExcel(buffer, 'test.xlsx');

    expect(result.id).toBeDefined();
    expect(result.originalName).toBe('test.xlsx');
    expect(result.rowCount).toBe(1);
    expect(result.uploadedBy).toBe('user');
  });

  it('should parse multiple rows correctly', async () => {
    const buffer = createTestExcelBuffer([TEST_ROW, TEST_ROW, TEST_ROW]);
    const result = await service.processExcel(buffer, 'multi.xlsx');
    expect(result.rowCount).toBe(3);
  });

  it('should store all column values in ExcelRow', async () => {
    const buffer = createTestExcelBuffer([TEST_ROW]);
    const file = await service.processExcel(buffer, 'columns.xlsx');
    const rows = await service.getFileRows(file.id);

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.cardindexId).toBe('1');
    expect(row.clientId).toBe('C001');
    expect(row.clientName).toBe('ООО Тест');
    expect(row.documentNumber).toBe('12345');
    expect(row.documentDate).toBe('01.01.2025');
    expect(row.documentAmount).toBe('150000.00');
    expect(row.payerInn).toBe('7701234567');
    expect(row.payerName).toBe('ООО Плательщик');
    expect(row.payerBankBik).toBe('044525225');
    expect(row.payerBank).toBe('ПАО Сбербанк');
    expect(row.payerAccount).toBe('40702810938000012345');
    expect(row.recipientInn).toBe('7709876543');
    expect(row.recipientBank).toBe('АО Альфа-Банк');
    expect(row.recipientBik).toBe('044525593');
    expect(row.recipientAccount).toBe('40702810100000054321');
    expect(row.deliveryType).toBe('электронно');
    expect(row.paymentPurpose).toBe('Оплата по договору №123');
    expect(row.paymentPriority).toBe('5');
    expect(row.operationType).toBe('01');
  });

  it('should return list of files', async () => {
    const files = await service.getFiles();
    expect(files.length).toBeGreaterThanOrEqual(3);
    // Files should be ordered by date DESC
    for (let i = 0; i < files.length - 1; i++) {
      expect(new Date(files[i].uploadedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(files[i + 1].uploadedAt).getTime());
    }
  });

  it('should return rows for a specific file', async () => {
    const buffer = createTestExcelBuffer([TEST_ROW]);
    const file = await service.processExcel(buffer, 'specific.xlsx');
    const rows = await service.getFileRows(file.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].fileUploadId).toBe(file.id);
  });

  it('should return single row by id', async () => {
    const buffer = createTestExcelBuffer([TEST_ROW]);
    const file = await service.processExcel(buffer, 'single-row.xlsx');
    const rows = await service.getFileRows(file.id);
    const row = await service.getRow(rows[0].id);
    expect(row).not.toBeNull();
    expect(row!.documentNumber).toBe('12345');
  });

  it('should return null for non-existent row', async () => {
    const row = await service.getRow(999999);
    expect(row).toBeNull();
  });

  it('should handle empty Excel (no data rows)', async () => {
    const buffer = createTestExcelBuffer([]);
    const result = await service.processExcel(buffer, 'empty.xlsx');
    expect(result.rowCount).toBe(0);
    const rows = await service.getFileRows(result.id);
    expect(rows).toHaveLength(0);
  });
});
