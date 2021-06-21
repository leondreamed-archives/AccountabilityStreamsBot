import "dotenv/config";
import Discord, { NewsChannel, ReactionUserManager } from "discord.js";
import schedule from "node-schedule";

let timeout: NodeJS.Timeout;
let updatesChannel: Discord.TextChannel;
let voiceChannel: Discord.VoiceChannel;
let guild: Discord.Guild;
let user: Discord.GuildMember;

const client = new Discord.Client();

async function revealGiftCard() {
  await updatesChannel.send(
    `LeonStreams has been offline for 30 minutes. Gift card code: ${process.env
      .GIFT_CARD_CODE!}`
  );
}

async function checkStreaming() {
  if (!user.voice.selfVideo) {
    await updatesChannel.send("LeonStreams is not streaming his video...");
    timeout = setTimeout(async () => {
      await revealGiftCard();
    }, 1000 * 60 * 30);
  }
}

client.on("ready", async () => {
  console.log("Bot is ready.");

  console.info("Fetching guild...");
  guild = await client.guilds.fetch(process.env.GUILD_ID!);

  console.info("Fetching user...");
  user = await guild.members.fetch(process.env.USER_ID!);

  console.info("Fetching updates channel...");
  updatesChannel = (await client.channels.fetch(
    process.env.UPDATES_CHANNEL_ID!
  )) as Discord.TextChannel;

  console.info("Fetching study stream channel...");
  voiceChannel = (await client.channels.fetch(
    process.env.VOICE_CHANNEL_ID!
  )) as Discord.VoiceChannel;

  // At 9:30PM every day, kick LeonStreams out of the voice
  schedule.scheduleJob("30 21 * * *", () => {
    user.voice.setChannel(null);
  });

  // At 8:30AM every day, check if LeonStreams is streaming
  schedule.scheduleJob("30 8 * * *", () => {
    checkStreaming();
  });
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member?.id !== process.env.USER_ID!) return;

  checkStreaming();
});

client.login(process.env.BOT_TOKEN);
