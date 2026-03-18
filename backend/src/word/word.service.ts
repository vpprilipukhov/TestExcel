import { Injectable } from '@nestjs/common';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from 'docx';
import { ExcelRow } from '../entities/excel-row.entity';

/**
 * Variable mapping from Excel columns to template placeholders:
 * (1) = documentDate       — Дата документа
 * (2) = documentNumber     — Номер документа
 * (3) = deliveryType       — Вид платежа
 * (4) = documentAmount     — Сумма документа
 * (5) = payerInn           — ИНН плательщика
 * (6) = payerName          — Наименование плательщика
 * (7) = payerAccount       — Счет плательщика
 * (8) = payerBankBik       — БИК банка плательщика
 * (9) = payerCorrAccount   — Кор. счет плательщика
 * (10) = payerBank         — Банк плательщика
 * (11) = recipientBankName — Наименование Банка получателя
 * (12) = recipientBik      — БИК получателя
 * (13) = recipientCorrAccount — Кор счет получателя
 * (14) = recipientAccount  — Счет получателя
 * (15) = recipientInn      — ИНН получателя
 * (16) = recipientBank     — Банк получателя
 * (17) = operationType     — Вид операции
 * (18) = paymentPriority   — Очередность платежа
 * (19) = paymentPurpose    — Назначение платежа
 */

function getVars(row: ExcelRow): Record<number, string> {
  return {
    1: row.documentDate ?? '',
    2: row.documentNumber ?? '',
    3: row.deliveryType ?? '',
    4: row.documentAmount ?? '',
    5: row.payerInn ?? '',
    6: row.payerName ?? '',
    7: row.payerAccount ?? '',
    8: row.payerBankBik ?? '',
    9: row.payerCorrAccount ?? '',
    10: row.payerBank ?? '',
    11: row.recipientBankName ?? '',
    12: row.recipientBik ?? '',
    13: row.recipientCorrAccount ?? '',
    14: row.recipientAccount ?? '',
    15: row.recipientInn ?? '',
    16: row.recipientBank ?? '',
    17: row.operationType ?? '',
    18: row.paymentPriority ?? '',
    19: row.paymentPurpose ?? '',
  };
}

const FONT = 'Times New Roman';
const FONT_SIZE = 20; // 10pt in half-points

function text(content: string, bold = false, size = FONT_SIZE): TextRun {
  return new TextRun({ text: content, font: FONT, size, bold });
}

function p(content: string, bold = false, alignment = AlignmentType.LEFT): Paragraph {
  return new Paragraph({ alignment, children: [text(content, bold)] });
}

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 1 },
  bottom: { style: BorderStyle.SINGLE, size: 1 },
  left: { style: BorderStyle.SINGLE, size: 1 },
  right: { style: BorderStyle.SINGLE, size: 1 },
};

function cell(
  content: string,
  width?: number,
  bold = false,
  borders: any = thinBorder,
): TableCell {
  return new TableCell({
    children: [p(content, bold)],
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    borders,
    verticalAlign: VerticalAlign.CENTER,
  });
}

@Injectable()
export class WordService {
  async generatePaymentRequirement(row: ExcelRow): Promise<Buffer> {
    const v = getVars(row);

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, bottom: 720, left: 720, right: 720 },
            },
          },
          children: [
            // Header line
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [text('0401061', false, 18)],
            }),

            // Date and form header
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell(v[1], 3000, false, noBorder),
                    cell('', 3000, false, noBorder),
                    cell('', 4000, false, noBorder),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('Поступ. в банк плат.', 3000, false, noBorder),
                    cell('Оконч. срока акцепта', 3000, false, noBorder),
                    cell('Списано со сч. плат.', 4000, false, noBorder),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 200 } }),

            // Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                text(`ПЛАТЕЖНОЕ ТРЕБОВАНИЕ № ${v[2]}`, true, 24),
              ],
            }),

            // Date and payment type
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell(`${v[1]}`, 3500),
                    cell('Дата', 1500),
                    cell(`${v[3]}`, 5000),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('', 3500),
                    cell('', 1500),
                    cell('Вид платежа', 5000),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Acceptance conditions
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell('Условие оплаты', 3500),
                    cell('Требуется получение акцепта плательщика', 3500),
                    cell('Срок для акцепта', 3000),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Amount in words
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell('Сумма прописью', 2500),
                    cell(v[4], 7500),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Payer section
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell(`ИНН ${v[5]}`, 5000),
                    cell('Сумма', 1500),
                    cell(v[4], 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell(v[6], 5000),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell(`Сч. № ${v[7]}`, 5000),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('Плательщик', 5000, true),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Payer's bank
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell(v[10], 5000),
                    cell('БИК', 1500),
                    cell(v[8], 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('', 5000),
                    cell('Сч. №', 1500),
                    cell(v[9], 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('Банк плательщика', 5000, true),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Recipient's bank
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell(v[11], 5000),
                    cell('БИК', 1500),
                    cell(v[12], 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('', 5000),
                    cell('Сч. №', 1500),
                    cell(v[13], 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('Банк получателя', 5000, true),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Recipient
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell(`ИНН ${v[15]}`, 5000),
                    cell('Сч. №', 1500),
                    cell(v[14], 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell(v[16], 5000),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('Получатель', 5000, true),
                    cell('', 1500),
                    cell('', 3500),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Operation type and priority
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell('Вид оп.', 1500),
                    cell(v[17], 2000),
                    cell('Очер. плат.', 1500),
                    cell(v[18], 2000),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('Наз. пл.', 1500),
                    cell('', 2000),
                    cell('Рез. поле', 1500),
                    cell('', 2000),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Payment purpose
            p('Назначение платежа', true),
            p(v[19]),

            new Paragraph({ spacing: { before: 200 } }),

            // Date of sending documents
            p('Дата отсылки (вручения) плательщику предусмотренных договором документов'),

            new Paragraph({ spacing: { before: 200 } }),

            // Signatures section
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell('Подписи', 3500),
                    cell('', 3500),
                    cell('Отметки банка получателя', 3000),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('', 3500),
                    cell('', 3500),
                    cell('', 3000),
                  ],
                }),
                new TableRow({
                  children: [
                    cell('М.П.', 3500),
                    cell('', 3500),
                    cell('', 3000),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 200 } }),

            // Partial payments table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    cell('№ ч. плат.', 1200),
                    cell('№ плат. ордера', 1500),
                    cell('Дата плат. ордера', 1500),
                    cell('Сумма частичного платежа', 2000),
                    cell('Сумма остатка платежа', 1800),
                    cell('Подпись', 1000),
                    cell('Дата помещения в картотеку', 1500),
                  ],
                }),
                new TableRow({
                  children: [
                    cell(v[1], 1200),
                    cell('', 1500),
                    cell('', 1500),
                    cell('', 2000),
                    cell('', 1800),
                    cell('', 1000),
                    cell('', 1500),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 100 } }),

            // Bank marks
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [text('Отметки банка плательщика')],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer as Buffer;
  }
}
