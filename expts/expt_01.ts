import { Broker } from "../models/broker.js"
import { GLOBAL_TIME, incrementTime } from "../models/globals.js"

const broker = new Broker(true)

for (let i = 0; i < 100; i++) {
	console.log(GLOBAL_TIME)
	broker.next()

	incrementTime()
}
