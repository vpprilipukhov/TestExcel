package com.excelpilot.service

import com.excelpilot.entity.*
import com.excelpilot.repository.ExcelRowRepository
import com.excelpilot.repository.FileUploadRepository
import org.apache.poi.ss.usermodel.CellType
import org.apache.poi.ss.usermodel.Row
import org.apache.poi.ss.usermodel.WorkbookFactory
import org.babyfish.jimmer.kt.new
import org.babyfish.jimmer.sql.kt.ast.expression.asc
import org.babyfish.jimmer.sql.kt.ast.expression.desc
import org.babyfish.jimmer.sql.kt.ast.expression.eq
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.ByteArrayInputStream
import java.time.LocalDateTime

@Service
class UploadService(
    private val fileUploadRepo: FileUploadRepository,
    private val excelRowRepo: ExcelRowRepository,
) {

    companion object {
        /** Excel column index → entity property setter (by position, 0-based) */
        private val COLUMN_KEYS = listOf(
            "cardindexId", "clientId", "offBalanceAccount", "cardIndexType1",
            "clientName", "cardIndexType2", "documentNumber", "status",
            "documentDate", "processingDate", "documentAmount", "paymentBalance",
            "currencyCode", "currency", "operationType", "paymentPurpose",
            "paymentPriority", "payerKpp", "payerInn", "payerName",
            "payerCorrAccount", "payerBankBik", "payerBank", "payerAccount",
            "kpp", "recipientInn", "recipientBank", "recipientCorrAccount",
            "recipientBik", "recipientBankName", "recipientAccount",
            "deliveryType", "accountNumberDt", "accountNumberKt",
            "docCardIndexEksId", "sourceFactory", "textReturn", "loadDate",
        )
    }

    @Transactional
    fun processExcel(buffer: ByteArray, originalName: String): FileUpload {
        val workbook = WorkbookFactory.create(ByteArrayInputStream(buffer))
        val sheet = workbook.getSheetAt(0)

        // Collect all rows as string arrays
        val allRows = mutableListOf<List<String>>()
        for (row in sheet) {
            allRows.add(readRow(row))
        }

        // Skip header row; skip optional "Номер" row
        var dataStartIndex = 1
        if (allRows.size > 1 && allRows[1].getOrElse(0) { "" }.lowercase().contains("номер")) {
            dataStartIndex = 2
        }

        val dataRows = allRows.drop(dataStartIndex).filter { row -> row.any { it.isNotEmpty() } }

        // Save file upload record
        val savedFile = fileUploadRepo.save(new(FileUpload::class).by {
            this.originalName = originalName
            this.rowCount = dataRows.size
            this.uploadedBy = "user"
            this.uploadedAt = LocalDateTime.now()
        })

        // Save excel rows
        for (row in dataRows) {
            val values = buildColumnMap(row)
            excelRowRepo.save(new(ExcelRow::class).by {
                fileUpload = new(FileUpload::class).by { id = savedFile.id }
                cardindexId = values["cardindexId"]
                clientId = values["clientId"]
                offBalanceAccount = values["offBalanceAccount"]
                cardIndexType1 = values["cardIndexType1"]
                clientName = values["clientName"]
                cardIndexType2 = values["cardIndexType2"]
                documentNumber = values["documentNumber"]
                status = values["status"]
                documentDate = values["documentDate"]
                processingDate = values["processingDate"]
                documentAmount = values["documentAmount"]
                paymentBalance = values["paymentBalance"]
                currencyCode = values["currencyCode"]
                currency = values["currency"]
                operationType = values["operationType"]
                paymentPurpose = values["paymentPurpose"]
                paymentPriority = values["paymentPriority"]
                payerKpp = values["payerKpp"]
                payerInn = values["payerInn"]
                payerName = values["payerName"]
                payerCorrAccount = values["payerCorrAccount"]
                payerBankBik = values["payerBankBik"]
                payerBank = values["payerBank"]
                payerAccount = values["payerAccount"]
                kpp = values["kpp"]
                recipientInn = values["recipientInn"]
                recipientBank = values["recipientBank"]
                recipientCorrAccount = values["recipientCorrAccount"]
                recipientBik = values["recipientBik"]
                recipientBankName = values["recipientBankName"]
                recipientAccount = values["recipientAccount"]
                deliveryType = values["deliveryType"]
                accountNumberDt = values["accountNumberDt"]
                accountNumberKt = values["accountNumberKt"]
                docCardIndexEksId = values["docCardIndexEksId"]
                sourceFactory = values["sourceFactory"]
                textReturn = values["textReturn"]
                loadDate = values["loadDate"]
            })
        }

        workbook.close()
        return savedFile
    }

    fun getFiles(): List<FileUpload> {
        val sql = fileUploadRepo.sql
        return sql.createQuery(FileUpload::class) {
            orderBy(table.uploadedAt.desc())
            select(table)
        }.execute()
    }

    fun getFileRows(fileId: Long): List<ExcelRow> {
        val sql = excelRowRepo.sql
        return sql.createQuery(ExcelRow::class) {
            where(table.fileUpload.id eq fileId)
            orderBy(table.id.asc())
            select(table)
        }.execute()
    }

    fun getRow(rowId: Long): ExcelRow? {
        return excelRowRepo.findNullable(rowId)
    }

    private fun readRow(row: Row): List<String> {
        val cells = mutableListOf<String>()
        for (i in 0 until row.lastCellNum.coerceAtLeast(0)) {
            val cell = row.getCell(i)
            val value = when {
                cell == null -> ""
                cell.cellType == CellType.NUMERIC -> {
                    val num = cell.numericCellValue
                    if (num == num.toLong().toDouble()) num.toLong().toString() else num.toString()
                }
                cell.cellType == CellType.STRING -> cell.stringCellValue ?: ""
                cell.cellType == CellType.BOOLEAN -> cell.booleanCellValue.toString()
                cell.cellType == CellType.FORMULA -> try { cell.stringCellValue } catch (_: Exception) { cell.numericCellValue.toString() }
                else -> ""
            }
            cells.add(value)
        }
        return cells
    }

    private fun buildColumnMap(row: List<String>): Map<String, String?> {
        val map = mutableMapOf<String, String?>()
        COLUMN_KEYS.forEachIndexed { idx, key ->
            map[key] = if (idx < row.size && row[idx].isNotEmpty()) row[idx] else null
        }
        return map
    }
}
