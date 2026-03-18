import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import * as XLSX from 'xlsx';
import AdmZip = require('adm-zip');

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry('word/document.xml');
  return entry ? entry.getData().toString('utf-8') : '';
}
import { UploadModule } from '../src/upload/upload.module';
import { FileUpload } from '../src/entities/file-upload.entity';
import { ExcelRow } from '../src/entities/excel-row.entity';

function createTestExcelBuffer(): Buffer {
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
  const row = [
    '1', 'C001', '40817', '2', 'ООО Тест', '2', '12345', 'Active',
    '01.01.2025', '02.01.2025', '150000.00', '50000.00', '643', 'RUB', '01',
    'Оплата по договору №123', '5', '770101001', '7701234567',
    'ООО Плательщик', '30101810400000000225', '044525225', 'ПАО Сбербанк',
    '40702810938000012345', '770201001', '7709876543', 'АО Альфа-Банк',
    '30101810200000000593', '044525593', 'АО Альфа-Банк',
    '40702810100000054321', 'электронно', '', '', '', '', '', '2025-01-01',
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, row]);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

describe('UploadController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [FileUpload, ExcelRow],
          synchronize: true,
        }),
        UploadModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/upload — should upload and parse Excel', async () => {
    const buffer = createTestExcelBuffer();

    const response = await request(app.getHttpServer())
      .post('/api/upload')
      .attach('file', buffer, 'test.xlsx')
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.originalName).toBe('test.xlsx');
    expect(response.body.rowCount).toBe(1);
  });

  it('POST /api/upload — should return 400 without file', async () => {
    await request(app.getHttpServer())
      .post('/api/upload')
      .expect(400);
  });

  it('GET /api/files — should return uploaded files', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/files')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toHaveProperty('originalName');
    expect(response.body[0]).toHaveProperty('rowCount');
    expect(response.body[0]).toHaveProperty('uploadedAt');
  });

  it('GET /api/files/:id/rows — should return rows for uploaded file', async () => {
    // First upload a file
    const buffer = createTestExcelBuffer();
    const uploadRes = await request(app.getHttpServer())
      .post('/api/upload')
      .attach('file', buffer, 'rows-test.xlsx')
      .expect(201);

    const fileId = uploadRes.body.id;

    const response = await request(app.getHttpServer())
      .get(`/api/files/${fileId}/rows`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].documentNumber).toBe('12345');
    expect(response.body[0].payerInn).toBe('7701234567');
    expect(response.body[0].documentAmount).toBe('150000.00');
  });

  it('GET /api/files/:id/rows — should return empty array for non-existent file', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/files/999999/rows')
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('GET /api/rows/:id/word — should generate a Word document', async () => {
    // Upload first
    const buffer = createTestExcelBuffer();
    const uploadRes = await request(app.getHttpServer())
      .post('/api/upload')
      .attach('file', buffer, 'word-test.xlsx')
      .expect(201);

    // Get rows
    const rowsRes = await request(app.getHttpServer())
      .get(`/api/files/${uploadRes.body.id}/rows`)
      .expect(200);

    const rowId = rowsRes.body[0].id;

    // Generate Word
    const wordRes = await request(app.getHttpServer())
      .get(`/api/rows/${rowId}/word`)
      .responseType('blob')
      .expect(200);

    expect(wordRes.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(wordRes.headers['content-disposition']).toContain('attachment');
    expect(wordRes.headers['content-disposition']).toContain(`payment_requirement_${rowId}.docx`);
    // Should have a non-empty body
    expect(wordRes.body.length).toBeGreaterThan(0);
  });

  it('GET /api/rows/:id/word — should return 404 for non-existent row', async () => {
    await request(app.getHttpServer())
      .get('/api/rows/999999/word')
      .expect(404);
  });

  it('Full flow: upload → list files → get rows → generate word', async () => {
    const buffer = createTestExcelBuffer();

    // Step 1: Upload
    const uploadRes = await request(app.getHttpServer())
      .post('/api/upload')
      .attach('file', buffer, 'flow-test.xlsx')
      .expect(201);
    const fileId = uploadRes.body.id;

    // Step 2: List files - should contain our file
    const filesRes = await request(app.getHttpServer())
      .get('/api/files')
      .expect(200);
    const ourFile = filesRes.body.find((f: any) => f.id === fileId);
    expect(ourFile).toBeDefined();
    expect(ourFile.originalName).toBe('flow-test.xlsx');

    // Step 3: Get rows
    const rowsRes = await request(app.getHttpServer())
      .get(`/api/files/${fileId}/rows`)
      .expect(200);
    expect(rowsRes.body).toHaveLength(1);

    // Step 4: Generate Word
    const wordRes = await request(app.getHttpServer())
      .get(`/api/rows/${rowsRes.body[0].id}/word`)
      .responseType('blob')
      .expect(200);
    const docxBuffer = Buffer.from(wordRes.body);
    expect(docxBuffer.length).toBeGreaterThan(5000);

    // Verify Word contains correct data
    const content = extractDocxText(docxBuffer);
    expect(content).toContain('12345');
    expect(content).toContain('7701234567');
    expect(content).toContain('150000.00');
  });
});
