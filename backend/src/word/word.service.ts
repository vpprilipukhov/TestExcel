import { Injectable } from '@nestjs/common';
import { ExcelRow } from '../entities/excel-row.entity';
import * as fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

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
  private readonly templatePath = 'templates/payment_template.docx';

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
