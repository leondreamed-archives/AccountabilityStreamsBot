import { giftCardChannel } from "./channel";

export let giftCardRevealed = false;

export async function revealGiftCard(reason: string) {
	if (!giftCardRevealed) {
		await giftCardChannel.send(
			`${reason}\nGift card code: ${process.env.GIFT_CARD_CODE!}`
		);
		giftCardRevealed = true;
	}
}
