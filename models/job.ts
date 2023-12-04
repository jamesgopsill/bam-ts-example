import { Agent, AgentTypes } from "./agent.js"
import { GLOBAL_TIME } from "./globals.js"
import { Message, MessageTypes } from "./message.js"

export enum JobStates {
	AVAILABLE = "available",
	SELECTED = "selected",
	COMPLETED = "completed",
}

export class Job extends Agent {
	status: JobStates = JobStates.AVAILABLE
	submissionTime: number
	printTime: number
	machineId: number = -1
	completedTime: number = -1

	constructor(id: number, printTime: number, debug: boolean = false) {
		super(id, AgentTypes.JOB, debug)
		this.submissionTime = GLOBAL_TIME
		this.printTime = printTime
	}

	handleMessage(msg: Message): void {
		this.messagesReceived += 1
		if (this.debug)
			console.log(`Job ${this.id}: Received Message ${msg.subject}`)

		switch (msg.subject) {
			case MessageTypes.MACHINE_IS_LOOKING_FOR_JOBS:
				this.machineIsLookingForJobsResponse(msg)
				break
			case MessageTypes.MACHINE_HAS_CHOSEN_A_JOB:
				this.machineHasChosenAJobResponse(msg)
				break
			case MessageTypes.JOB_COMPLETE:
				this.jobCompleteResponse(msg)
				break
			default:
				console.log("Method to handle msg not implemented")
				process.exit(1)
		}
	}

	jobCompleteResponse(msg: Message) {
		this.status = JobStates.COMPLETED
		this.completedTime = msg.body.completedAt
		this.broker.disconnect(this)
	}

	machineIsLookingForJobsResponse(msg: Message) {
		if (this.status == JobStates.AVAILABLE) {
			const response: Message = {
				thread: msg.thread,
				to: msg.from,
				from: this.id,
				sendAt: GLOBAL_TIME + 1,
				agentType: AgentTypes.MACHINE,
				subject: MessageTypes.JOB_IS_AVAILABLE,
				body: {
					printTime: this.printTime,
				},
			}
			this.broker.receive(response)
		}
	}

	machineHasChosenAJobResponse(msg: Message) {
		switch (this.status) {
			case JobStates.AVAILABLE:
				if (this.debug) {
					console.log(`Job ${this.id} has accepted ${msg.from}`)
				}
				const r1: Message = {
					thread: msg.thread,
					to: msg.from,
					from: this.id,
					sendAt: GLOBAL_TIME + 1,
					agentType: AgentTypes.MACHINE,
					subject: MessageTypes.JOB_HAS_ACCEPTED_MACHINES_OFFER,
					body: {
						printTime: this.printTime,
					},
				}
				this.broker.receive(r1)
				this.status = JobStates.SELECTED
				break
			default:
				const r2: Message = {
					thread: msg.thread,
					to: msg.from,
					from: this.id,
					sendAt: GLOBAL_TIME + 1,
					agentType: AgentTypes.MACHINE,
					subject: MessageTypes.JOB_HAS_DECLINED_MACHINES_OFFER,
					body: {},
				}
				this.broker.receive(r2)
				break
		}
	}
}
