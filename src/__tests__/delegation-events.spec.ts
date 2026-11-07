// npx vitest run __tests__/delegation-events.spec.ts

import { SoftixerEventName, SoftixerEventsSchema, taskEventSchema } from "@roo-code/types"

describe("delegation event schemas", () => {
	test("SoftixerEventsSchema validates tuples", () => {
		expect(() => (SoftixerEventsSchema.shape as any)[SoftixerEventName.TaskDelegated].parse(["p", "c"])).not.toThrow()
		expect(() =>
			(SoftixerEventsSchema.shape as any)[SoftixerEventName.TaskDelegationCompleted].parse(["p", "c", "s"]),
		).not.toThrow()
		expect(() =>
			(SoftixerEventsSchema.shape as any)[SoftixerEventName.TaskDelegationResumed].parse(["p", "c"]),
		).not.toThrow()

		// invalid shapes
		expect(() => (SoftixerEventsSchema.shape as any)[SoftixerEventName.TaskDelegated].parse(["p"])).toThrow()
		expect(() =>
			(SoftixerEventsSchema.shape as any)[SoftixerEventName.TaskDelegationCompleted].parse(["p", "c"]),
		).toThrow()
		expect(() => (SoftixerEventsSchema.shape as any)[SoftixerEventName.TaskDelegationResumed].parse(["p"])).toThrow()
	})

	test("taskEventSchema discriminated union includes delegation events", () => {
		expect(() =>
			taskEventSchema.parse({
				eventName: SoftixerEventName.TaskDelegated,
				payload: ["p", "c"],
				taskId: 1,
			}),
		).not.toThrow()

		expect(() =>
			taskEventSchema.parse({
				eventName: SoftixerEventName.TaskDelegationCompleted,
				payload: ["p", "c", "s"],
				taskId: 1,
			}),
		).not.toThrow()

		expect(() =>
			taskEventSchema.parse({
				eventName: SoftixerEventName.TaskDelegationResumed,
				payload: ["p", "c"],
				taskId: 1,
			}),
		).not.toThrow()
	})
})


