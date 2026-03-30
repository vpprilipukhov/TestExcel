import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("jvm") version "2.1.0"
    kotlin("plugin.spring") version "2.1.0"
    id("com.google.devtools.ksp") version "2.1.0-1.0.29"
}

group = "com.excelpilot"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

val jimmerVersion = "0.9.35"

dependencies {
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.jetbrains.kotlin:kotlin-reflect")

    // Jimmer ORM
    implementation("org.babyfish.jimmer:jimmer-spring-boot-starter:$jimmerVersion")
    ksp("org.babyfish.jimmer:jimmer-ksp:$jimmerVersion")

    // H2 Database
    runtimeOnly("com.h2database:h2")

    // Apache POI (Excel + Word)
    implementation("org.apache.poi:poi:5.3.0")
    implementation("org.apache.poi:poi-ooxml:5.3.0")

    // Test
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

kotlin {
    sourceSets.main {
        kotlin.srcDir("build/generated/ksp/main/kotlin")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}
