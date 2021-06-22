import "dotenv/config";
import Discord from "discord.js";
import schedule from "node-schedule";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault("America/Toronto");

let timeout: NodeJS.Timeout | null = null;
let updatesChannel: Discord.TextChannel;
let voiceChannel: Discord.VoiceChannel;
let guild: Discord.Guild;
let user: Discord.GuildMember;
let notStreamingMessage: Discord.Message | null = null;
let giftCardRevealed = false;

const client = new Discord.Client();

async function revealGiftCard() {
  await updatesChannel.send(
    `${user.toString()} hasn't been streaming video for 15 minutes. Gift card code: ${process
      .env.GIFT_CARD_CODE!}`
  );
  giftCardRevealed = true;
}

function doesUserHaveVideo() {
  return (
    user.voice.channel !== null &&
    user.voice.channelID === process.env.VOICE_CHANNEL_ID &&
    user.voice.selfVideo
  );
}

async function checkStreaming() {
  // Don't perform any checks if the gift card has already been revealed
  if (giftCardRevealed) {
    console.info(
      "The gift card has already been revealed, streaming check skipped."
    );
    return;
  }

  // If it's before 8:30AM or past 9:30PM, return
  const date = dayjs();
  console.info(
    `Current hour: ${date.tz().hour()}; Current minute: ${date.tz().minute()}`
  );

  // Before 8:30AM
  if (date.tz().hour() * 60 + date.tz().minute() < 8 * 60 + 30) {
    return;
  }

  // Past 9:30PM
  if (date.tz().hour() * 60 + date.tz().minute() > 21 * 60 + 30) {
    return;
  }

  if (!doesUserHaveVideo()) {
    console.info("User is not streaming his video...");
    if (timeout === null) {
      timeout = setTimeout(async () => {
        // If the user still hasn't started streaming video by 15 mins, then reveal the gift card
        if (!doesUserHaveVideo()) {
          await revealGiftCard();
        }
      }, 1000 * 60 * 15);
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

  // Every minute, check if the user is streaming
  schedule.scheduleJob("* * * * *", () => {
    checkStreaming();
  });

  checkStreaming();
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.member?.id !== process.env.USER_ID!) return;

  checkStreaming();
});

client.login(process.env.BOT_TOKEN);
