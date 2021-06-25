import { updatesChannel } from "./channel";
import schedule from "node-schedule";
import Discord from "discord.js";
import { user } from "./user";
import { revealGiftCard } from "./gift-card";
import { scheduleTzJob } from "./schedule";
import tesseract from "node-tesseract-ocr";
import Jimp from "jimp";
import fs from "fs";

const tesseractConfig = {
	lang: "eng",
	oem: 1,
	psm: 3,
};

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

const topLeft = { x: 50, y: 100 };
const bottomRight = { x: 1000, y: 250 };

export function registerSleepCyclePlugin(client: Discord.Client) {
	// Request the sleep cycle message at 8:30AM
	const requestRule = new schedule.RecurrenceRule();
	requestRule.minute = 30;
	requestRule.hour = 8;
	scheduleTzJob(requestRule, () => {
		if (latestSleepCycleMessage === null) {
			requestSleepCycle();
		}
	});

	const checkRule = new schedule.RecurrenceRule();
	checkRule.minute = 45;
	checkRule.hour = 8;
	// Check if the user sent a sleep cycle screenshot at 8:45AM
	scheduleTzJob(checkRule, () => {
		// If user didn't send a sleep cycle screenshot, reset
		if (latestSleepCycleMessage === null) {
			revealGiftCard(
				`${user.toString()} failed to provide a sleep cycle screenshot.`
			);
		}
		latestSleepCycleMessage = null;
	});

	client.on("message", async (message) => {
		if (userIds.includes(message.author.id) && message.attachments.size > 0) {
			const attachment = message.attachments.first()!;
			if (
				attachment.height === sleepCycleScreenshotHeight &&
				attachment.width === sleepCycleScreenshotWidth
			) {
				const image = await Jimp.read(attachment.url);
				image.crop(50, 100, 950, 150);

				// Finding the right-most white pixel of the image
				let maxX = 0;
				image.scan(
					0,
					0,
					image.bitmap.width,
					image.bitmap.height,
					function (x, y, idx) {
						const red = this.bitmap.data[idx + 0];
						const green = this.bitmap.data[idx + 1];
						const blue = this.bitmap.data[idx + 2];

						if (red === 255 && green === 255 && blue === 255) {
							if (x > maxX) {
								maxX = x;
							}
						}
					}
				);
				image.crop(maxX, 0, image.getWidth() - maxX, image.getHeight());

				const imageBuffer = await image.getBufferAsync("image/jpeg");
				fs.writeFileSync("image.jpg", imageBuffer);

				const text = await tesseract.recognize(imageBuffer, tesseractConfig);
				message.channel.send(`Date detected: ${text.trim()}`);
				console.info("Sleep cycle screenshot detected.");
				latestSleepCycleMessage = message;
			}
		}
	});
}
