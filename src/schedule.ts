import schedule, { JobCallback } from "node-schedule";

export function scheduleTzJob(rule: schedule.RecurrenceRule, cb: JobCallback) {
	schedule.scheduleJob({ ...rule, tz: "America/Toronto" }, cb);
}
