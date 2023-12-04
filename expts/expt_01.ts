import { Broker } from "../models/broker.js"
import { GLOBAL_TIME, incrementTime } from "../models/globals.js"
import { Job } from "../models/job.js"
import { fcfs } from "../models/logics.js"
import { Machine } from "../models/machine.js"

const broker = new Broker(true)

let n: number = 0

const jobs: Job[] = []
for (let i = 0; i < 2; i++) {
	const printTime = Math.floor(Math.random() * 5) + 1
	const job = new Job(n, printTime, true)
	job.connectToBroker(broker)
	jobs.push(job)
	n += 1
}

const machines: Machine[] = []
const machine = new Machine(n, fcfs, true)
machine.connectToBroker(broker)
machines.push(machine)
n += 1

for (let i = 0; i < 100; i++) {
	console.log(GLOBAL_TIME)
	for (const machine of machines) {
		machine.next()
	}

	broker.next()

	incrementTime()
}
