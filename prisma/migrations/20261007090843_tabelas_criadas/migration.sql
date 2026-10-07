-- CreateTable
CREATE TABLE `users` (
    `id_users_pk` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id_users_pk`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctors` (
    `id_doctors_pk` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `crm_number` VARCHAR(10) NOT NULL,
    `crm_state` VARCHAR(2) NOT NULL,
    `specialty` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `unique_crm`(`crm_number`, `crm_state`),
    PRIMARY KEY (`id_doctors_pk`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id_patients_pk` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `birth_date` DATE NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `cpf`(`cpf`),
    PRIMARY KEY (`id_patients_pk`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shifts` (
    `id_shifts_pk` INTEGER NOT NULL AUTO_INCREMENT,
    `doctors_id_fk` INTEGER NOT NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `doctors_id_fk`(`doctors_id_fk`),
    PRIMARY KEY (`id_shifts_pk`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `triages` (
    `id_triages_pk` INTEGER NOT NULL AUTO_INCREMENT,
    `patients_id_fk` INTEGER NOT NULL,
    `doctors_id_fk` INTEGER NULL,
    `symptoms` TEXT NOT NULL,
    `temperature` DOUBLE NOT NULL,
    `heart_rate` INTEGER NOT NULL,
    `oxygen_saturation` INTEGER NOT NULL,
    `pain_level` INTEGER NOT NULL,
    `is_unconscious` BOOLEAN NOT NULL DEFAULT false,
    `has_severe_bleeding` BOOLEAN NOT NULL DEFAULT false,
    `priority` VARCHAR(10) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    `arrived_at` DATETIME(0) NOT NULL,
    `called_at` DATETIME(0) NULL,
    `finished_at` DATETIME(0) NULL,

    INDEX `patients_id_fk`(`patients_id_fk`),
    INDEX `doctors_id_fk`(`doctors_id_fk`),
    PRIMARY KEY (`id_triages_pk`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shifts` ADD CONSTRAINT `shifts_ibfk_1` FOREIGN KEY (`doctors_id_fk`) REFERENCES `doctors`(`id_doctors_pk`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `triages` ADD CONSTRAINT `triages_ibfk_1` FOREIGN KEY (`patients_id_fk`) REFERENCES `patients`(`id_patients_pk`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `triages` ADD CONSTRAINT `triages_ibfk_2` FOREIGN KEY (`doctors_id_fk`) REFERENCES `doctors`(`id_doctors_pk`) ON DELETE SET NULL ON UPDATE RESTRICT;
