import { describe, expect, it } from "vitest"

import {
  computeMembershipVisitSchedule,
  parseHourMinuteFromTimeString,
} from "@/lib/membership-plan-assign"

/**
 * Week arithmetic that decides when a customer's visits actually land.
 * The clock is injected (`now`) rather than read from Date.now(), so these
 * assertions do not flake depending on what day the suite happens to run.
 */

// Wednesday 2026-08-12, 10:00 local.
const WEDNESDAY = new Date(2026, 7, 12, 10, 0, 0, 0)

function isoWeekday(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 7 : day
}

describe("parseHourMinuteFromTimeString", () => {
  it("defaults to 9:00 when nothing is given", () => {
    expect(parseHourMinuteFromTimeString(null)).toEqual({ hour: 9, minute: 0 })
    expect(parseHourMinuteFromTimeString("")).toEqual({ hour: 9, minute: 0 })
  })

  it("parses 24h and bare hours", () => {
    expect(parseHourMinuteFromTimeString("14:30")).toEqual({ hour: 14, minute: 30 })
    expect(parseHourMinuteFromTimeString("8")).toEqual({ hour: 8, minute: 0 })
  })

  it("parses am/pm", () => {
    expect(parseHourMinuteFromTimeString("2:15 pm")).toEqual({ hour: 14, minute: 15 })
    expect(parseHourMinuteFromTimeString("12:00 am")).toEqual({ hour: 0, minute: 0 })
    expect(parseHourMinuteFromTimeString("12:00 pm")).toEqual({ hour: 12, minute: 0 })
  })

  it("clamps nonsense instead of producing an invalid date later", () => {
    const parsed = parseHourMinuteFromTimeString("99:99")
    expect(parsed.hour).toBeLessThanOrEqual(23)
    expect(parsed.minute).toBeLessThanOrEqual(59)
  })
})

describe("computeMembershipVisitSchedule", () => {
  it("creates one visit per week, on the chosen weekday", () => {
    const dates = computeMembershipVisitSchedule(WEDNESDAY, "NEXT_WEEK", 2, 4, 9, 0)
    expect(dates).toHaveLength(4)
    for (const d of dates) {
      expect(isoWeekday(d)).toBe(2)
      expect(d.getHours()).toBe(9)
      expect(d.getMinutes()).toBe(0)
    }
  })

  it("spaces visits exactly seven days apart", () => {
    const dates = computeMembershipVisitSchedule(WEDNESDAY, "NEXT_WEEK", 3, 4, 9, 0)
    for (let i = 1; i < dates.length; i++) {
      const deltaDays = (dates[i].getTime() - dates[i - 1].getTime()) / 86_400_000
      expect(Math.round(deltaDays)).toBe(7)
    }
  })

  it("starts next week when asked, never in the current one", () => {
    const dates = computeMembershipVisitSchedule(WEDNESDAY, "NEXT_WEEK", 1, 1, 9, 0)
    expect(dates[0].getTime()).toBeGreaterThan(WEDNESDAY.getTime())
    // Monday of the following week is 2026-08-17.
    expect(dates[0].getDate()).toBe(17)
  })

  it("uses a THIS_WEEK day that has not happened yet", () => {
    // Friday (5) is still ahead of Wednesday.
    const dates = computeMembershipVisitSchedule(WEDNESDAY, "THIS_WEEK", 5, 1, 9, 0)
    expect(dates[0].getDate()).toBe(14)
  })

  it("rolls a THIS_WEEK day that already passed into the next week", () => {
    // Monday (1) is behind Wednesday, so it cannot be scheduled in the past.
    const dates = computeMembershipVisitSchedule(WEDNESDAY, "THIS_WEEK", 1, 1, 9, 0)
    expect(dates[0].getTime()).toBeGreaterThan(WEDNESDAY.getTime())
  })

  it("never schedules a visit in the past", () => {
    for (const weekday of [1, 2, 3, 4, 5, 6, 7]) {
      for (const startWeek of ["THIS_WEEK", "NEXT_WEEK"] as const) {
        const dates = computeMembershipVisitSchedule(WEDNESDAY, startWeek, weekday, 4, 9, 0)
        expect(dates[0].getTime()).toBeGreaterThan(WEDNESDAY.getTime())
      }
    }
  })

  it("clamps the visit count to a sane range", () => {
    expect(computeMembershipVisitSchedule(WEDNESDAY, "NEXT_WEEK", 2, 0, 9, 0)).toHaveLength(1)
    expect(computeMembershipVisitSchedule(WEDNESDAY, "NEXT_WEEK", 2, 999, 9, 0)).toHaveLength(12)
  })
})
