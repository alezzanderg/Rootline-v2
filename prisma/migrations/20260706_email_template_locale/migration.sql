-- CreateEnum
CREATE TYPE "EmailTemplateLocale" AS ENUM ('EN', 'ES');

-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN "locale" "EmailTemplateLocale" NOT NULL DEFAULT 'EN';
ALTER TABLE "EmailTemplate" ADD COLUMN "slug" TEXT;

-- Legacy rows (Spanish defaults seeded before locale support)
UPDATE "EmailTemplate" SET "locale" = 'ES' WHERE "slug" IS NULL;

UPDATE "EmailTemplate" SET "slug" = 'estimate-send' WHERE "category" = 'ESTIMATE' AND "slug" IS NULL;
UPDATE "EmailTemplate" SET "slug" = 'inquiry-reply' WHERE "category" = 'INQUIRY' AND "slug" IS NULL;
UPDATE "EmailTemplate" SET "slug" = 'general-follow-up' WHERE "category" = 'GENERAL' AND "slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_locale_key" ON "EmailTemplate"("slug", "locale");

-- CreateIndex
CREATE INDEX "EmailTemplate_category_locale_active_idx" ON "EmailTemplate"("category", "locale", "active");

-- DropIndex
DROP INDEX IF EXISTS "EmailTemplate_category_active_idx";
