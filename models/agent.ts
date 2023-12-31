import { Broker } from "./broker.js"

export enum AgentTypes {
	JOB = "job",
	MACHINE = "machine",
}

export class Agent {
	id: number
	type: AgentTypes
	broker: Broker
	messagesSent: number = 0
	messagesReceived: number = 0
	debug: boolean = false

	constructor(id: number, type: AgentTypes, debug: boolean = false) {
		this.id = id
		this.type = type
		this.debug = debug
	}

	connectToBroker(broker: Broker) {
		broker.connect(this)
		this.broker = broker
		this.messagesSent += 1
		this.messagesReceived += 1
	}

	handleMessage(msg: any) {}

	next() {}
}
