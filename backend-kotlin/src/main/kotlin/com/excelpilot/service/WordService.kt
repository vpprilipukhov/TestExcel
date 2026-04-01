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
        "1" to (row.documentDate ?: ""),
        "2" to (row.documentNumber ?: ""),
        "3" to (row.deliveryType ?: ""),
        "4" to (row.documentAmount ?: ""),
        "4_words" to (row.documentAmount ?: ""),
        "5" to (row.payerInn ?: ""),
        "6" to (row.payerName ?: ""),
        "7" to (row.payerAccount ?: ""),
        "8" to (row.payerBankBik ?: ""),
        "9" to (row.payerCorrAccount ?: ""),
        "10" to (row.payerBank ?: ""),
        "11" to (row.recipientBankName ?: ""),
        "12" to (row.recipientBik ?: ""),
        "13" to (row.recipientCorrAccount ?: ""),
        "14" to (row.recipientAccount ?: ""),
        "15" to (row.recipientInn ?: ""),
        "16" to (row.recipientBank ?: ""),
        "17" to (row.operationType ?: ""),
        "18" to (row.paymentPriority ?: ""),
        "19" to (row.paymentPurpose ?: ""),
    )
}
