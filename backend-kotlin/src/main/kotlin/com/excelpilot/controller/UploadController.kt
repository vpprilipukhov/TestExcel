package com.excelpilot.controller

import com.excelpilot.service.UploadService
import com.excelpilot.service.WordService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException

@RestController
@RequestMapping("/api")
@CrossOrigin
class UploadController(
    private val uploadService: UploadService,
    private val wordService: WordService,
) {

    @PostMapping("/upload")
    fun uploadExcel(@RequestParam("file") file: MultipartFile): ResponseEntity<Any> {
        if (file.isEmpty) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided")
        }
        val result = uploadService.processExcel(file.bytes, file.originalFilename ?: "unknown.xlsx")
        return ResponseEntity.ok(result)
    }

    @GetMapping("/files")
    fun getFiles(): ResponseEntity<Any> {
        return ResponseEntity.ok(uploadService.getFiles())
    }

    @GetMapping("/files/{id}/rows")
    fun getFileRows(@PathVariable id: Long): ResponseEntity<Any> {
        return ResponseEntity.ok(uploadService.getFileRows(id))
    }

    @GetMapping("/rows/{id}/word")
    fun generateWord(@PathVariable id: Long): ResponseEntity<ByteArray> {
        val row = uploadService.getRow(id)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Row not found")

        val docxBytes = wordService.generatePaymentRequirement(row)

        val headers = HttpHeaders()
        headers.contentType = MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        headers.setContentDispositionFormData("attachment", "payment_requirement_$id.docx")

        return ResponseEntity.ok().headers(headers).body(docxBytes)
    }
}
