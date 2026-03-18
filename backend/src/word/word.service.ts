import { Injectable } from '@nestjs/common';
import { ExcelRow } from '../entities/excel-row.entity';
import * as fs from 'fs';
import * as path from 'path';
import PizZip = require('pizzip');
import Docxtemplater = require('docxtemplater');

/**
 * Template placeholders mapping:
 * {document_date}         — (1) Дата документа
 * {document_number}       — (2) Номер документа
 * {delivery_type}         — (3) Вид платежа
 * {document_amount}       — (4) Сумма документа
 * {document_amount_words} — (4) Сумма прописью
 * {payer_inn}             — (5) ИНН плательщика
 * {payer_name}            — (6) Наименование плательщика
 * {payer_account}         — (7) Счет плательщика
 * {payer_bank_bik}        — (8) БИК банка плательщика
 * {payer_corr_account}    — (9) Кор. счет плательщика
 * {payer_bank}            — (10) Банк плательщика
 * {recipient_bank_name}   — (11) Наименование Банка получателя
 * {recipient_bik}         — (12) БИК получателя
 * {recipient_corr_account}— (13) Кор счет получателя
 * {recipient_account}     — (14) Счет получателя
 * {recipient_inn}         — (15) ИНН получателя
 * {recipient_bank}        — (16) Банк получателя
 * {operation_type}        — (17) Вид операции
 * {payment_priority}      — (18) Очередность платежа
 * {payment_purpose}       — (19) Назначение платежа
 */

function buildTemplateData(row: ExcelRow): Record<string, string> {
  return {
    document_date: row.documentDate ?? '',
    document_number: row.documentNumber ?? '',
    delivery_type: row.deliveryType ?? '',
    document_amount: row.documentAmount ?? '',
    document_amount_words: row.documentAmount ?? '',
    payer_inn: row.payerInn ?? '',
    payer_name: row.payerName ?? '',
    payer_account: row.payerAccount ?? '',
    payer_bank_bik: row.payerBankBik ?? '',
    payer_corr_account: row.payerCorrAccount ?? '',
    payer_bank: row.payerBank ?? '',
    recipient_bank_name: row.recipientBankName ?? '',
    recipient_bik: row.recipientBik ?? '',
    recipient_corr_account: row.recipientCorrAccount ?? '',
    recipient_account: row.recipientAccount ?? '',
    recipient_inn: row.recipientInn ?? '',
    recipient_bank: row.recipientBank ?? '',
    operation_type: row.operationType ?? '',
    payment_priority: row.paymentPriority ?? '',
    payment_purpose: row.paymentPurpose ?? '',
  };
}

@Injectable()
export class WordService {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(
      process.cwd(),
      'templates',
      'payment_template.docx',
    );
  }

  async generatePaymentRequirement(row: ExcelRow): Promise<Buffer> {
    const templateContent = fs.readFileSync(this.templatePath, 'binary');
    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render(buildTemplateData(row));

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return buf;
  }
}
