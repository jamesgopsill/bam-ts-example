import { AgentTypes } from "./agent.js"

export enum MessageTypes {
	JOB_IS_AVAILABLE = "job_is_available",
	MACHINE_IS_LOOKING_FOR_JOBS = "machine_is_looking_for_jobs",
	MACHINE_HAS_CHOSEN_A_JOB = "machine_has_chosen_a_job",
	JOB_HAS_ACCEPTED_MACHINES_OFFER = "job_has_accepted_machines_offer",
	JOB_HAS_DECLINED_MACHINES_OFFER = "job_has_declined_machines_offer",
	JOB_COMPLETE = "job_complete",
}

export interface Message {
	thread: string
	from: number
	to: number
	agentType: AgentTypes
	sendAt: number
	subject: MessageTypes
	body: any
}
