import { Injectable } from '@nestjs/common';
import { ExcelRow } from '../entities/excel-row.entity';
import * as fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

function buildTemplateData(row: ExcelRow): Record<string, string> {
  return {
    '1': row.documentDate ?? '',
    '2': row.documentNumber ?? '',
    '3': row.deliveryType ?? '',
    '4': row.documentAmount ?? '',
    '4_words': row.documentAmount ?? '',
    '5': row.payerInn ?? '',
    '6': row.payerName ?? '',
    '7': row.payerAccount ?? '',
    '8': row.payerBankBik ?? '',
    '9': row.payerCorrAccount ?? '',
    '10': row.payerBank ?? '',
    '11': row.recipientBankName ?? '',
    '12': row.recipientBik ?? '',
    '13': row.recipientCorrAccount ?? '',
    '14': row.recipientAccount ?? '',
    '15': row.recipientInn ?? '',
    '16': row.recipientBank ?? '',
    '17': row.operationType ?? '',
    '18': row.paymentPriority ?? '',
    '19': row.paymentPurpose ?? '',
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
