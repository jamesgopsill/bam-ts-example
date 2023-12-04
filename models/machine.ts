import { randomUUID } from "crypto"
import { Agent, AgentTypes } from "./agent.js"
import { GLOBAL_TIME } from "./globals.js"
import { Message, MessageTypes } from "./message.js"

export enum MachineStates {
	AVAILABLE = "available",
	WAITING_FOR_RESPONSES = "waiting_for_responses",
	WAITING_FOR_ACCEPTANCE = "waiting_for_acceptance",
	BUSY = "busy",
}

export class Machine extends Agent {
	status: MachineStates = MachineStates.AVAILABLE
	currentJob: number = -1
	jobsBrokered: number[] = []
	responses: Message[] = []
	responseThreadId: string = ""
	wait: number = -1
	rejections: number = 0
	logic: () => number

	constructor(id: number, logic: () => number, debug: boolean = false) {
		super(id, AgentTypes.MACHINE, debug)
		this.logic = logic
	}

	next() {
		if (this.debug) {
			console.log(`#${GLOBAL_TIME} Machine ${this.id}: next() ${this.status}`)
		}

		switch (this.status) {
			case MachineStates.AVAILABLE:
				this.nextAvailable()
				break
			case MachineStates.WAITING_FOR_RESPONSES:
				this.nextWaitingForRespones()
			case MachineStates.WAITING_FOR_ACCEPTANCE:
				break
			case MachineStates.BUSY:
				this.nextBusy()
				break
			default:
				break
		}
	}

	nextBusy() {
		this.currentJob -= 1
		if (this.currentJob == 0) {
			this.currentJob = -1
			this.status = MachineStates.AVAILABLE
			const msg: Message = {
				thread: this.responseThreadId,
				from: this.id,
				to: this.jobsBrokered[this.jobsBrokered.length - 1],
				sendAt: GLOBAL_TIME + 1,
				agentType: AgentTypes.JOB,
				subject: MessageTypes.JOB_COMPLETE,
				body: {},
			}
			this.messagesSent += 1
			this.broker.receive(msg)
		}
	}

	nextWaitingForRespones() {
		if (this.wait != GLOBAL_TIME) {
			return
		}
		if (this.debug) {
			console.log(`#${GLOBAL_TIME} Machine ${this.id}: Deciding on responses`)
		}
		const invalidResponses: number[] = []
		for (const [idx, msg] of this.responses.entries()) {
			if (msg.thread != this.responseThreadId) {
				invalidResponses.push(idx)
			}
		}
		invalidResponses.sort((a, b) => b - a)
		for (const idx of invalidResponses) {
			this.responses.splice(idx, 1)
		}
		//
		const id = this.logic()
		if (id >= 0) {
			this.status = MachineStates.WAITING_FOR_ACCEPTANCE
			const msg: Message = {
				thread: this.responseThreadId,
				from: this.id,
				to: id,
				sendAt: GLOBAL_TIME + 1,
				agentType: AgentTypes.JOB,
				subject: MessageTypes.MACHINE_HAS_CHOSEN_A_JOB,
				body: {},
			}
			this.messagesSent += 1
			this.broker.receive(msg)
		} else {
			this.status = MachineStates.AVAILABLE
		}
		this.responses = []
		this.wait = -1
	}

	nextAvailable() {
		this.responses = []
		this.wait = GLOBAL_TIME + 5
		this.responseThreadId = randomUUID()
		this.status = MachineStates.WAITING_FOR_RESPONSES
		const msg: Message = {
			thread: this.responseThreadId,
			from: this.id,
			to: -1,
			agentType: AgentTypes.JOB,
			sendAt: GLOBAL_TIME + 1,
			subject: MessageTypes.MACHINE_IS_LOOKING_FOR_JOBS,
			body: {},
		}
		this.messagesSent += 1
		this.broker.receive(msg)
	}

	handleMessage(msg: Message): void {
		this.messagesReceived += 1
		if (this.debug) {
			console.log(
				`#${GLOBAL_TIME} machine ${this.id}: Received Message ${msg.subject}`,
			)
		}
		switch (msg.subject) {
			case MessageTypes.JOB_IS_AVAILABLE:
				this.responses.push(msg)
				break
			case MessageTypes.JOB_HAS_ACCEPTED_MACHINES_OFFER:
				this.status = MachineStates.BUSY
				this.currentJob = msg.body.printTime
				this.jobsBrokered.push(msg.from)
				this.responses = []
				break
			case MessageTypes.JOB_HAS_DECLINED_MACHINES_OFFER:
				this.rejections += 1
				this.status = MachineStates.AVAILABLE
				this.responses = []
				break
			default:
				console.log("Message has not been handled")
				process.exit()
		}
	}
}
