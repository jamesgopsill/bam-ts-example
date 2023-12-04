import { Agent, AgentTypes } from "./agent.js"
import { GLOBAL_TIME } from "./globals.js"
import { Message } from "./message.js"

export class Broker {
	messagesReceived: number = 0
	messagesSent: number = 0
	addressBook: { [key in AgentTypes]: { [key: number]: Agent } } = {
		machine: {},
		job: {},
	}
	debug: boolean = false
	messageBuffer: { [key: number]: Message[] } = {}

	constructor(debug: boolean = false) {
		this.debug = debug
	}

	next() {
		if (GLOBAL_TIME in this.messageBuffer) {
			const msgs = this.messageBuffer[GLOBAL_TIME]
			for (const [_, msg] of msgs.entries()) {
				if (msg.sendAt == GLOBAL_TIME) {
					if (msg.to == -1) {
						for (const [_, agent] of Object.entries(
							this.addressBook[msg.agentType],
						)) {
							this.messagesSent += 1
							agent.handleMessage(msg)
						}
					} else {
						for (const [_, agents] of Object.entries(this.addressBook)) {
							if (agents[msg.to]) {
								agents[msg.to].handleMessage(msg)
								this.messagesSent += 1
								break
							}
						}
					}
				}
			}
		}
	}

	connect(agent: Agent) {
		if (this.debug)
			console.log(`#${GLOBAL_TIME} Broker: ${agent.type} ${agent.id} connected`)
		this.addressBook[agent.type][agent.id] = agent
		this.messagesReceived += 1
		this.messagesSent += 1
	}

	disconnect(agent: Agent) {
		this.messagesReceived += 1
		const book = this.addressBook[agent.type]
		if (book[agent.id]) {
			if (this.debug)
				console.log(
					`#${GLOBAL_TIME} Broker: ${agent.type} ${agent.id} disconnected`,
				)
			delete book[agent.id]
		}
	}

	receive(msg: Message) {
		this.messagesReceived += 1
		if (!this.messageBuffer[msg.sendAt]) {
			this.messageBuffer[msg.sendAt] = []
		}
		this.messageBuffer[msg.sendAt].push(msg)
	}
}
