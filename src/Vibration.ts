import { Haptics, ImpactStyle } from "@capacitor/haptics";

export async function giveHapticFeedback(style = ImpactStyle.Light) {
  await Haptics.impact({ style });
}

export async function vibrate() {
  await Haptics.vibrate();
}
