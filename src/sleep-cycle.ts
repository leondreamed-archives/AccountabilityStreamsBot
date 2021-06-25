import { updatesChannel } from "./channel";
import schedule from "node-schedule";
import Discord, { Message } from "discord.js";
import { user } from "./user";
import { revealGiftCard } from "./gift-card";

let latestSleepCycleMessage: Discord.Message | null = null;

export function requestSleepCycle() {
	updatesChannel.send(
		`${process.env.USER_ID}, please send your Sleep Cycle screenshot within the next 15 minutes.`
	);
}

const sleepCycleText =
	"Analysis by Sleep Cycle alarm clock. Download here: https://www.sleepcycle.com/ #sleepCycle";
const userIds = [
	process.env.USER_ID,
	...process.env.ALTERNATIVE_USER_IDS!.split(","),
];

const sleepCycleScreenshotWidth = 1242;
const sleepCycleScreenshotHeight = 2359;

export function registerSleepCyclePlugin(client: Discord.Client) {
	// Request the sleep cycle message at 8:30AM
	schedule.scheduleJob("30 8 * * *", () => {
		if (latestSleepCycleMessage === null) {
			requestSleepCycle();
		}
	});

	// Check if the user sent a sleep cycle screenshot at 8:45AM
	schedule.scheduleJob("45 8 * * *", () => {
		// If user didn't send a sleep cycle screenshot, reset
		if (latestSleepCycleMessage === null) {
			revealGiftCard(
				`${user.toString()} failed to provide a sleep cycle screenshot.`
			);
		}
		latestSleepCycleMessage = null;
	});

	client.on("message", async (message) => {
		if (
			message.content === sleepCycleText &&
			userIds.includes(message.author.id) &&
			message.attachments.size > 0
		) {
			const attachment = message.attachments.first()!;
			if (
				attachment.height === sleepCycleScreenshotHeight &&
				attachment.width === sleepCycleScreenshotWidth
			) {
				console.info("Sleep cycle screenshot detected.");
				latestSleepCycleMessage = message;
			}
		}
	});
}
