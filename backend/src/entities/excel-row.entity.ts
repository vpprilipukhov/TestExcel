import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FileUpload } from './file-upload.entity';

@Entity('excel_rows')
export class ExcelRow {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FileUpload, (file) => file.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fileUploadId' })
  fileUpload: FileUpload;

  @Column()
  fileUploadId: number;

  @Column({ nullable: true }) cardindexId: string;
  @Column({ nullable: true }) clientId: string;
  @Column({ nullable: true }) offBalanceAccount: string;        // Внебалансовый счет
  @Column({ nullable: true }) cardIndexType1: string;           // Вид картотеки (1)
  @Column({ nullable: true }) clientName: string;               // Наименование клиента
  @Column({ nullable: true }) cardIndexType2: string;           // Вид картотеки (2)
  @Column({ nullable: true }) documentNumber: string;           // Номер документа — (2)
  @Column({ nullable: true }) status: string;                   // Статус
  @Column({ nullable: true }) documentDate: string;             // Дата документа — (1)
  @Column({ nullable: true }) processingDate: string;           // Дата обработки документа
  @Column({ nullable: true }) documentAmount: string;           // Сумма документа — (4)
  @Column({ nullable: true }) paymentBalance: string;           // Остаток платежа
  @Column({ nullable: true }) currencyCode: string;             // Код валюты
  @Column({ nullable: true }) currency: string;                 // Валюта
  @Column({ nullable: true }) operationType: string;            // Вид операции — (17)
  @Column({ nullable: true }) paymentPurpose: string;           // Назначение платежа — (19)
  @Column({ nullable: true }) paymentPriority: string;          // Очередность платежа — (18)
  @Column({ nullable: true }) payerKpp: string;                 // payerkpp
  @Column({ nullable: true }) payerInn: string;                 // ИНН плательщика — (5)
  @Column({ nullable: true }) payerName: string;                // Наименование плательщика — (6)
  @Column({ nullable: true }) payerCorrAccount: string;         // Кор. счет плательщика — (9)
  @Column({ nullable: true }) payerBankBik: string;             // БИК банка плательщика — (8)
  @Column({ nullable: true }) payerBank: string;                // Банк плательщика — (10)
  @Column({ nullable: true }) payerAccount: string;             // Счет плательщика — (7)
  @Column({ nullable: true }) kpp: string;                      // КПП
  @Column({ nullable: true }) recipientInn: string;             // ИНН получателя — (15)
  @Column({ nullable: true }) recipientBank: string;            // Банк получателя — (16)
  @Column({ nullable: true }) recipientCorrAccount: string;     // Кор счет получателя — (13)
  @Column({ nullable: true }) recipientBik: string;             // БИК получателя — (12)
  @Column({ nullable: true }) recipientBankName: string;        // Наименование Банка получателя — (11)
  @Column({ nullable: true }) recipientAccount: string;         // Счет получателя — (14)
  @Column({ nullable: true }) deliveryType: string;             // deliverytype — (3)
  @Column({ nullable: true }) accountNumberDt: string;          // accountnumberdt
  @Column({ nullable: true }) accountNumberKt: string;          // accountnumberkt
  @Column({ nullable: true }) docCardIndexEksId: string;        // doccardindexeksid
  @Column({ nullable: true }) sourceFactory: string;            // sourcefactory
  @Column({ nullable: true }) textReturn: string;               // textreturn
  @Column({ nullable: true }) loadDate: string;                 // load_date
}
