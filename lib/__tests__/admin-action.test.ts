import { describe, expect, it } from "vitest"

import { ACTION_ERRORS, actionErrorMessage, hasPermission, type Permission } from "@/lib/admin-action"

/**
 * The permission matrix decides whether a technician can change your prices.
 * These assertions are the contract; if someone widens a role, a test fails
 * instead of the change landing quietly.
 */
describe("hasPermission", () => {
  const MONEY_AND_CONFIG: Permission[] = [
    "customers:write",
    "properties:write",
    "quotes:write",
    "catalog:write",
    "scheduling:write",
    "archive",
    "payments:write",
    "employees:write",
    "settings:write",
  ]

  it("lets ADMIN and MANAGER do everything", () => {
    for (const permission of [...MONEY_AND_CONFIG, "jobs:operate" as const]) {
      expect(hasPermission("ADMIN", permission)).toBe(true)
      expect(hasPermission("MANAGER", permission)).toBe(true)
    }
  })

  it("lets field roles move jobs and nothing else", () => {
    for (const role of ["CREW_LEAD", "TECHNICIAN"] as const) {
      expect(hasPermission(role, "jobs:operate")).toBe(true)
      for (const permission of MONEY_AND_CONFIG) {
        expect(hasPermission(role, permission)).toBe(false)
      }
    }
  })

  it("never lets a field role archive records", () => {
    expect(hasPermission("TECHNICIAN", "archive")).toBe(false)
    expect(hasPermission("CREW_LEAD", "archive")).toBe(false)
  })

  it("never lets a field role touch payments", () => {
    expect(hasPermission("TECHNICIAN", "payments:write")).toBe(false)
    expect(hasPermission("CREW_LEAD", "payments:write")).toBe(false)
  })
})

describe("actionErrorMessage", () => {
  it("returns null when there is no error code", () => {
    expect(actionErrorMessage(null)).toBeNull()
    expect(actionErrorMessage(undefined)).toBeNull()
    expect(actionErrorMessage("")).toBeNull()
  })

  it("maps every known code to a message", () => {
    for (const code of Object.keys(ACTION_ERRORS)) {
      expect(actionErrorMessage(code)).toBe(ACTION_ERRORS[code as keyof typeof ACTION_ERRORS])
    }
  })

  it("falls back to a generic message for an unknown code", () => {
    // A stale bookmark or a hand-edited URL must not render a blank banner.
    expect(actionErrorMessage("gato")).toBe(ACTION_ERRORS.error)
  })
})
