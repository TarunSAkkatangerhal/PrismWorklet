-- ===============================================
-- MOU & POC Columns Migration
-- Samsung PRISM Worklet Management System
-- Date: March 6, 2026
-- ===============================================

-- Adds Point of Contact (college-level) and MOU tracking columns
-- Run this with: mysql -u root -p prismdbupdated < 004_add_mou_columns.sql

USE prismdbupdated;

ALTER TABLE colleges
    ADD COLUMN poc VARCHAR(255) NULL,
    ADD COLUMN mou_start DATE NULL,
    ADD COLUMN mou_end DATE NULL,
    ADD COLUMN mou_active TINYINT(1) DEFAULT 0,
    ADD COLUMN mou_attachments JSON NULL;
