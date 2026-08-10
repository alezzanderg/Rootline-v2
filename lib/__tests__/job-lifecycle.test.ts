import { describe, expect, it } from "vitest"

import { ALLOWED_FROM, canTransition } from "@/lib/job-lifecycle"
import type { JobStatus } from "@/lib/generated/prisma/enums"

/**
 * The state machine that closes the operational loop. Before it existed a Job
 * was written once and never updated, so every one of these transitions was
 * unreachable.
 */
describe("canTransition", () => {
  const ALL: JobStatus[] = ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]

  it("allows the happy path forward", () => {
    expect(canTransition("SCHEDULED", "start")).toBe(true)
    expect(canTransition("IN_PROGRESS", "complete")).toBe(true)
  })

  it("refuses to complete a job that never started", () => {
    // Skipping IN_PROGRESS would leave startedAt null on a finished job and
    // make any future duration or cost math wrong.
    expect(canTransition("SCHEDULED", "complete")).toBe(false)
  })

  it("allows cancelling only while the job is still open", () => {
    expect(canTransition("SCHEDULED", "cancel")).toBe(true)
    expect(canTransition("IN_PROGRESS", "cancel")).toBe(true)
    expect(canTransition("COMPLETED", "cancel")).toBe(false)
    expect(canTransition("CANCELLED", "cancel")).toBe(false)
  })

  it("treats CANCELLED as terminal for every transition", () => {
    for (const transition of Object.keys(ALLOWED_FROM) as Array<keyof typeof ALLOWED_FROM>) {
      expect(canTransition("CANCELLED", transition)).toBe(false)
    }
  })

  it("allows reopening a completed job and nothing else from COMPLETED", () => {
    expect(canTransition("COMPLETED", "reopen")).toBe(true)
    expect(canTransition("COMPLETED", "start")).toBe(false)
    expect(canTransition("COMPLETED", "reschedule")).toBe(false)
    expect(canTransition("COMPLETED", "reassign")).toBe(false)
  })

  it("only allows reopen from COMPLETED", () => {
    for (const status of ALL.filter((s) => s !== "COMPLETED")) {
      expect(canTransition(status, "reopen")).toBe(false)
    }
  })

  it("allows rescheduling and reassigning only open jobs", () => {
    for (const transition of ["reschedule", "reassign"] as const) {
      expect(canTransition("SCHEDULED", transition)).toBe(true)
      expect(canTransition("IN_PROGRESS", transition)).toBe(true)
      expect(canTransition("COMPLETED", transition)).toBe(false)
      expect(canTransition("CANCELLED", transition)).toBe(false)
    }
  })

  it("never lists a status outside the enum as a legal source", () => {
    for (const from of Object.values(ALLOWED_FROM)) {
      for (const status of from) {
        expect(ALL).toContain(status)
      }
    }
  })
})
