package com.excelpilot.entity

import org.babyfish.jimmer.sql.*
import java.time.LocalDateTime

@Entity
@Table(name = "file_uploads")
interface FileUpload {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long

    val originalName: String

    val rowCount: Int

    val uploadedBy: String?

    val uploadedAt: LocalDateTime

    @OneToMany(mappedBy = "fileUpload")
    val rows: List<ExcelRow>
}
