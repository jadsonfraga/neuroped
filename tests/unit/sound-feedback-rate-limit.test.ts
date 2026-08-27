import assert from "node:assert/strict";
import { haptic } from "../../client/src/lib/haptic";
import {
  softBell,
  softError,
  softSuccess,
} from "../../client/src/lib/softSounds";

let now = 0;
let oscillatorStarts = 0;
const scheduledDelays: number[] = [];
const vibrations: Array<number | number[]> = [];
const values = new Map<string, string>();

class FakeAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};

  createOscillator() {
    return {
      type: "sine",
      frequency: {
        setValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
      },
      connect: () => undefined,
      start: () => {
        oscillatorStarts += 1;
      },
      stop: () => undefined,
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: () => undefined,
        linearRampToValueAtTime: () => undefined,
        exponentialRampToValueAtTime: () => undefined,
      },
      connect: () => undefined,
    };
  }

  createBiquadFilter() {
    return {
      type: "lowpass",
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: () => undefined,
    };
  }
}

const fakeWindow = {
  AudioContext: FakeAudioContext,
  webkitAudioContext: FakeAudioContext,
  setTimeout: (callback: () => void, delay: number) => {
    scheduledDelays.push(delay);
    callback();
    return 1;
  },
  dispatchEvent: () => true,
};
const fakeDocument = { visibilityState: "visible" };
const fakeNavigator = {
  vibrate: (pattern: number | number[]) => {
    vibrations.push(pattern);
    return true;
  },
};
const fakeStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => {
    values.set(key, value);
  },
};

const globalNames = [
  "window",
  "document",
  "navigator",
  "localStorage",
  "performance",
] as const;
const previousDescriptors = new Map<string, PropertyDescriptor | undefined>();
for (const name of globalNames) {
  previousDescriptors.set(
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
}

function installGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

try {
  installGlobal("window", fakeWindow);
  installGlobal("document", fakeDocument);
  installGlobal("navigator", fakeNavigator);
  installGlobal("localStorage", fakeStorage);
  installGlobal("performance", { now: () => now });
  values.set("neuroped:sounds", "on");
  values.set("neuroped:sound-volume", "1");
  values.set("neuroped:haptic", "on");

  softSuccess();
  softSuccess();
  assert.equal(
    scheduledDelays.length,
    3,
    "softSuccess direto deve bloquear a repetição imediata",
  );
  now = 449;
  softSuccess();
  assert.equal(scheduledDelays.length, 3, "softSuccess deve respeitar 450 ms");
  now = 450;
  softSuccess();
  assert.equal(
    scheduledDelays.length,
    6,
    "softSuccess deve voltar a emitir após 450 ms",
  );

  const beforeBell = oscillatorStarts;
  softBell();
  softBell();
  assert.equal(
    oscillatorStarts,
    beforeBell + 1,
    "softBell direto deve bloquear a repetição imediata",
  );
  now = 1_100;
  softBell();
  assert.equal(
    oscillatorStarts,
    beforeBell + 2,
    "softBell deve respeitar 650 ms",
  );

  const beforeError = oscillatorStarts;
  softError();
  softError();
  assert.equal(
    oscillatorStarts,
    beforeError + 1,
    "softError direto deve bloquear a repetição imediata",
  );
  now = 1_900;
  softError();
  assert.equal(
    oscillatorStarts,
    beforeError + 2,
    "softError deve respeitar 800 ms",
  );

  haptic.success();
  haptic.success();
  assert.equal(
    vibrations.length,
    1,
    "haptic.success direto deve bloquear a repetição imediata",
  );
  now = 2_350;
  haptic.success();
  assert.equal(vibrations.length, 2, "haptic.success deve respeitar 450 ms");

  haptic.notify();
  haptic.notify();
  assert.equal(
    vibrations.length,
    3,
    "haptic.notify direto deve bloquear a repetição imediata",
  );
  now = 3_000;
  haptic.notify();
  assert.equal(vibrations.length, 4, "haptic.notify deve respeitar 650 ms");

  haptic.warning();
  haptic.warning();
  assert.equal(
    vibrations.length,
    5,
    "haptic.warning direto deve bloquear a repetição imediata",
  );
  now = 3_800;
  haptic.warning();
  assert.equal(vibrations.length, 6, "haptic.warning deve respeitar 800 ms");

  haptic.error();
  haptic.error();
  assert.equal(
    vibrations.length,
    7,
    "haptic.error direto deve bloquear a repetição imediata",
  );
  now = 4_600;
  haptic.error();
  assert.equal(vibrations.length, 8, "haptic.error deve respeitar 800 ms");

  haptic.select();
  haptic.select();
  assert.equal(
    vibrations.length,
    9,
    "haptic.select deve manter o limite de 180 ms",
  );
  now = 4_780;
  haptic.select();
  assert.equal(
    vibrations.length,
    10,
    "haptic.select deve voltar a emitir após 180 ms",
  );
} finally {
  for (const name of globalNames) {
    const descriptor = previousDescriptors.get(name);
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as Record<string, unknown>)[name];
  }
}

console.log(
  "✓ sound feedback regressions: primitivos legados respeitam throttling semântico",
);
