import { GuildMember } from "discord.js";

export let user: GuildMember;

export function setUser(guildMember: GuildMember) {
	user = guildMember;
}
