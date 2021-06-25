import dayjs from "dayjs";
import { Message } from "discord.js";
import { updatesChannel } from "./channel";
import { user } from "./user";
import schedule from "node-schedule";
import Discord from "discord.js";
import { giftCardRevealed, revealGiftCard } from "./gift-card";
import { scheduleTzJob } from "./schedule";

export const bufferMinutes = 15;
let timeout: NodeJS.Timeout | null = null;
let notStreamingMessage: Message | null = null;

function doesUserHaveVideo() {
	return (
		user.voice.channel !== null &&
		user.voice.channelID === process.env.VOICE_CHANNEL_ID &&
		user.voice.selfVideo
	);
}

function shouldCheck({ ignoreBuffer }: { ignoreBuffer: boolean }) {
	const date = dayjs();
	const hour = date.tz().hour();
	const minute = date.tz().minute();

	console.info(`Current hour: ${hour}; Current minute: ${minute}`);
	let elapsedMinutes = hour * 60 + minute;
	const eightThirtyAM = 8 * 60 + 30;
	const nineThirtyPM = 21 * 60 + 30;

	if (ignoreBuffer) {
		return elapsedMinutes >= eightThirtyAM && elapsedMinutes < nineThirtyPM;
	} else {
		return (
			elapsedMinutes >= eightThirtyAM &&
			elapsedMinutes < nineThirtyPM + bufferMinutes
		);
	}
}

export async function checkStreaming() {
	// Don't perform any checks if the gift card has already been revealed
	if (giftCardRevealed) {
		console.info(
			"The gift card has already been revealed, streaming check skipped."
		);
		return;
	}

	// If it's before 8:30AM or after 9:45PM, no need to check video.
	if (!shouldCheck({ ignoreBuffer: false })) return;

	if (!doesUserHaveVideo()) {
		// Don't announce the user isn't streaming if it's not between 8:30AM and 9:30PM
		if (!shouldCheck({ ignoreBuffer: true })) return;

		console.info("User is not streaming his video...");
		if (timeout === null) {
			timeout = setTimeout(async () => {
				// If the user still hasn't started streaming video by 15 mins, then reveal the gift card
				if (!doesUserHaveVideo()) {
					await revealGiftCard(
						`${user.toString()} hasn't been streaming video for ${bufferMinutes} minutes.`
					);
				}
			}, 1000 * 60 * bufferMinutes);
			let message = await updatesChannel.send(
				`${user.toString()} is not streaming his video...`
			);
			notStreamingMessage = message;
		}
	} else {
		console.info("User is streaming his video and the timeout was cleared.");
		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = null;
		await notStreamingMessage?.delete();
		notStreamingMessage = null;
	}
}

export function registerStreamPlugin(client: Discord.Client) {
	const rule = new schedule.RecurrenceRule();
	scheduleTzJob(rule, () => {
		checkStreaming();
	});

	checkStreaming();

	client.on("voiceStateUpdate", async (oldState, newState) => {
		if (oldState.member?.id !== process.env.USER_ID!) return;

		checkStreaming();
	});
}
