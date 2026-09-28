import { emit, world } from "@/lib/world";

import { ambient } from "./ambient";

const PREF = "lk-sound";

export const readSoundPref = () => {
  try {
    return window.localStorage.getItem(PREF);
  } catch {
    return null;
  }
};

const writeSoundPref = (v: "on" | "off") => {
  try {
    window.localStorage.setItem(PREF, v);
  } catch {
    /* storage unavailable: the preference just isn't remembered */
  }
};

/** Turns the score on or off. Must run inside a user gesture when turning on. */
export const setSound = async (on: boolean, remember: boolean) => {
  if (on) {
    try {
      await ambient.start();
    } catch {
      return;
    }
  } else {
    void ambient.stop();
  }
  world.soundOn = on;
  emit("sound");
  if (remember) writeSoundPref(on ? "on" : "off");
};
