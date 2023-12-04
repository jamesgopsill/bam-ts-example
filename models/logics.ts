import { Machine } from "./machine.js"

export function fcfs(this: Machine): number {
	if (this.responses.length == 0) {
		return -1
	}
	return this.responses[0].from
}
