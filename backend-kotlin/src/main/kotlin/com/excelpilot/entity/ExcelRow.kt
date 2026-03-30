package com.excelpilot.entity

import org.babyfish.jimmer.sql.*

@Entity
@Table(name = "excel_rows")
interface ExcelRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long

    @ManyToOne
    @JoinColumn(name = "file_upload_id")
    val fileUpload: FileUpload

    @Column(name = "cardindex_id")
    val cardindexId: String?

    @Column(name = "client_id")
    val clientId: String?

    val offBalanceAccount: String?
    val cardIndexType1: String?
    val clientName: String?
    val cardIndexType2: String?
    val documentNumber: String?
    val status: String?
    val documentDate: String?
    val processingDate: String?
    val documentAmount: String?
    val paymentBalance: String?
    val currencyCode: String?
    val currency: String?
    val operationType: String?
    val paymentPurpose: String?
    val paymentPriority: String?
    val payerKpp: String?
    val payerInn: String?
    val payerName: String?
    val payerCorrAccount: String?
    val payerBankBik: String?
    val payerBank: String?
    val payerAccount: String?
    val kpp: String?
    val recipientInn: String?
    val recipientBank: String?
    val recipientCorrAccount: String?
    val recipientBik: String?
    val recipientBankName: String?
    val recipientAccount: String?
    val deliveryType: String?
    val accountNumberDt: String?
    val accountNumberKt: String?
    val docCardIndexEksId: String?
    val sourceFactory: String?
    val textReturn: String?
    val loadDate: String?
}
