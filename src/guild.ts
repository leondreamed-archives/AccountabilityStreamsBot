import { Guild } from "discord.js";

export let guild: Guild;

export function setGuild(newGuild: Guild) {
	guild = newGuild;
}
