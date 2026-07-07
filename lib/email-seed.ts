import { DEFAULT_EMAIL_TEMPLATES, EMAIL_TEMPLATES_SYNC_VERSION } from "@/lib/email-templates"
import { prisma } from "@/lib/prisma"

const EMAIL_TEMPLATES_VERSION_KEY = "emailTemplatesSyncVersion"

async function getTemplatesSyncVersion(): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT "value"
    FROM "AppSetting"
    WHERE "key" = ${EMAIL_TEMPLATES_VERSION_KEY}
    LIMIT 1
  `
  return rows[0]?.value ?? null
}

async function setTemplatesSyncVersion(version: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "AppSetting" ("key", "value", "updatedAt")
    VALUES (${EMAIL_TEMPLATES_VERSION_KEY}, ${version}, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET
      "value" = EXCLUDED."value",
      "updatedAt" = NOW()
  `
}

/** Idempotent seed for built-in EN/ES templates. Safe to call during a server render. */
export async function ensureDefaultEmailTemplates(): Promise<void> {
  const storedVersion = await getTemplatesSyncVersion()
  const shouldSyncContent = storedVersion !== EMAIL_TEMPLATES_SYNC_VERSION

  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { slug: template.slug, locale: template.locale },
    })

    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
          slug: template.slug,
          name: template.name,
          category: template.category,
          locale: template.locale,
          description: template.description,
          subject: template.subject,
          htmlBody: template.htmlBody,
        },
      })
      continue
    }

    if (shouldSyncContent) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: {
          name: template.name,
          description: template.description,
          subject: template.subject,
          htmlBody: template.htmlBody,
        },
      })
    }
  }

  if (shouldSyncContent) {
    await setTemplatesSyncVersion(EMAIL_TEMPLATES_SYNC_VERSION)
  }
}
