import { WordService } from '../src/word/word.service';
import { ExcelRow } from '../src/entities/excel-row.entity';
import AdmZip = require('adm-zip');

function extractDocxText(buffer: Buffer): string {
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry('word/document.xml');
  return entry ? entry.getData().toString('utf-8') : '';
}

function createMockRow(): ExcelRow {
  const row = new ExcelRow();
  row.id = 1;
  row.fileUploadId = 1;
  row.cardindexId = '1';
  row.clientId = 'C001';
  row.offBalanceAccount = '40817';
  row.cardIndexType1 = '2';
  row.clientName = 'ООО Тест';
  row.cardIndexType2 = '2';
  row.documentNumber = '12345';
  row.status = 'Active';
  row.documentDate = '01.01.2025';
  row.processingDate = '02.01.2025';
  row.documentAmount = '150000.00';
  row.paymentBalance = '50000.00';
  row.currencyCode = '643';
  row.currency = 'RUB';
  row.operationType = '01';
  row.paymentPurpose = 'Оплата по договору №123';
  row.paymentPriority = '5';
  row.payerKpp = '770101001';
  row.payerInn = '7701234567';
  row.payerName = 'ООО Плательщик';
  row.payerCorrAccount = '30101810400000000225';
  row.payerBankBik = '044525225';
  row.payerBank = 'ПАО Сбербанк';
  row.payerAccount = '40702810938000012345';
  row.kpp = '770201001';
  row.recipientInn = '7709876543';
  row.recipientBank = 'АО Альфа-Банк';
  row.recipientCorrAccount = '30101810200000000593';
  row.recipientBik = '044525593';
  row.recipientBankName = 'АО Альфа-Банк';
  row.recipientAccount = '40702810100000054321';
  row.deliveryType = 'электронно';
  row.accountNumberDt = '';
  row.accountNumberKt = '';
  row.docCardIndexEksId = '';
  row.sourceFactory = '';
  row.textReturn = '';
  row.loadDate = '2025-01-01';
  return row;
}

describe('WordService', () => {
  let service: WordService;

  beforeAll(() => {
    service = new WordService();
  });

  it('should generate a valid .docx buffer', async () => {
    const row = createMockRow();
    const buffer = await service.generatePaymentRequirement(row);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    // DOCX files start with PK (ZIP signature)
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
  });

  it('should generate non-empty document', async () => {
    const row = createMockRow();
    const buffer = await service.generatePaymentRequirement(row);
    // A real docx with tables should be substantial
    expect(buffer.length).toBeGreaterThan(5000);
  });

  it('should include variable data in the docx content', async () => {
    const row = createMockRow();
    const buffer = await service.generatePaymentRequirement(row);
    const content = extractDocxText(buffer);
    expect(content).toContain('12345'); // documentNumber (2)
    expect(content).toContain('01.01.2025'); // documentDate (1)
    expect(content).toContain('150000.00'); // documentAmount (4)
    expect(content).toContain('7701234567'); // payerInn (5)
    expect(content).toContain('044525225'); // payerBankBik (8)
    expect(content).toContain('7709876543'); // recipientInn (15)
    expect(content).toContain('044525593'); // recipientBik (12)
  });

  it('should handle row with empty/null fields gracefully', async () => {
    const row = new ExcelRow();
    row.id = 2;
    row.fileUploadId = 1;
    // All other fields are undefined/null
    const buffer = await service.generatePaymentRequirement(row);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should contain payment requirement structure markers', async () => {
    const row = createMockRow();
    const buffer = await service.generatePaymentRequirement(row);
    const content = extractDocxText(buffer);
    expect(content).toContain('0401061');
    expect(content).toContain('ПЛАТЕЖНОЕ ТРЕБОВАНИЕ');
  });
});
