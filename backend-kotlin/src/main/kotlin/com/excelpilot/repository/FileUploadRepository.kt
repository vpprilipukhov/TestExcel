package com.excelpilot.repository

import com.excelpilot.entity.FileUpload
import org.babyfish.jimmer.spring.repository.KRepository

interface FileUploadRepository : KRepository<FileUpload, Long>
