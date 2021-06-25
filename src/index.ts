import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "dotenv/config";
import { setUser } from "./user";
import { setUpdatesChannel, setVoiceChannel, updatesChannel } from "./channel";
import { guild, setGuild } from "./guild";
import Discord from "discord.js";
import { registerSleepCyclePlugin } from "./sleep-cycle";
import { registerStreamPlugin } from "./stream";

export const client = new Discord.Client();

client.login(process.env.BOT_TOKEN);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Toronto");

client.on("ready", async () => {
	console.log("Bot is ready.");

	console.info("Fetching guild...");
	setGuild(await client.guilds.fetch(process.env.GUILD_ID!));

	console.info("Fetching user...");
	setUser(await guild.members.fetch(process.env.USER_ID!));

	console.info("Fetching updates channel...");
	setUpdatesChannel(
		(await client.channels.fetch(
			process.env.UPDATES_CHANNEL_ID!
		)) as Discord.TextChannel
	);

	console.info("Fetching study stream channel...");
	setVoiceChannel(
		(await client.channels.fetch(
			process.env.VOICE_CHANNEL_ID!
		)) as Discord.VoiceChannel
	);

	registerSleepCyclePlugin(client);
	registerStreamPlugin(client);
});
