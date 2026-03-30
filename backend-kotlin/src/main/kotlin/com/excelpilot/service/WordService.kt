package com.excelpilot.service

import com.excelpilot.entity.ExcelRow
import org.apache.poi.xwpf.usermodel.XWPFDocument
import org.apache.poi.xwpf.usermodel.XWPFParagraph
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.io.ByteArrayOutputStream

@Service
class WordService {

    private val templatePath = "templates/payment_template.docx"

    fun generatePaymentRequirement(row: ExcelRow): ByteArray {
        val templateStream = ClassPathResource(templatePath).inputStream
        val doc = XWPFDocument(templateStream)

        val placeholders = buildPlaceholders(row)

        // Replace in paragraphs (body)
        for (paragraph in doc.paragraphs) {
            replacePlaceholders(paragraph, placeholders)
        }

        // Replace in tables
        for (table in doc.tables) {
            for (tableRow in table.rows) {
                for (cell in tableRow.tableCells) {
                    for (paragraph in cell.paragraphs) {
                        replacePlaceholders(paragraph, placeholders)
                    }
                }
            }
        }

        val out = ByteArrayOutputStream()
        doc.write(out)
        doc.close()
        templateStream.close()

        return out.toByteArray()
    }

    private fun replacePlaceholders(paragraph: XWPFParagraph, placeholders: Map<String, String>) {
        // Collect full text from all runs to handle split placeholders
        val fullText = paragraph.runs.joinToString("") { it.text() ?: "" }

        if (!fullText.contains("{")) return

        var replaced = fullText
        for ((key, value) in placeholders) {
            replaced = replaced.replace("{$key}", value)
        }

        if (replaced == fullText) return

        // Clear all runs and set text in the first one
        val runs = paragraph.runs
        if (runs.isEmpty()) return

        runs[0].setText(replaced, 0)
        for (i in runs.size - 1 downTo 1) {
            runs[i].setText("", 0)
        }
    }

    private fun buildPlaceholders(row: ExcelRow): Map<String, String> = mapOf(
        "document_date" to (row.documentDate ?: ""),
        "document_number" to (row.documentNumber ?: ""),
        "delivery_type" to (row.deliveryType ?: ""),
        "document_amount" to (row.documentAmount ?: ""),
        "document_amount_words" to (row.documentAmount ?: ""),
        "payer_inn" to (row.payerInn ?: ""),
        "payer_name" to (row.payerName ?: ""),
        "payer_account" to (row.payerAccount ?: ""),
        "payer_bank_bik" to (row.payerBankBik ?: ""),
        "payer_corr_account" to (row.payerCorrAccount ?: ""),
        "payer_bank" to (row.payerBank ?: ""),
        "recipient_bank_name" to (row.recipientBankName ?: ""),
        "recipient_bik" to (row.recipientBik ?: ""),
        "recipient_corr_account" to (row.recipientCorrAccount ?: ""),
        "recipient_account" to (row.recipientAccount ?: ""),
        "recipient_inn" to (row.recipientInn ?: ""),
        "recipient_bank" to (row.recipientBank ?: ""),
        "operation_type" to (row.operationType ?: ""),
        "payment_priority" to (row.paymentPriority ?: ""),
        "payment_purpose" to (row.paymentPurpose ?: ""),
    )
}
