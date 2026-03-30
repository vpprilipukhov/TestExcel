package com.excelpilot.repository

import com.excelpilot.entity.ExcelRow
import org.babyfish.jimmer.spring.repository.KRepository

interface ExcelRowRepository : KRepository<ExcelRow, Long>
