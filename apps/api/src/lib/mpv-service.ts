import MPV from "node-mpv";
import { EventEmitter } from "events";

// Singleton MPV instance and EventEmitter for events
let mpv: MPV | null = null;
const mpvEvents = new EventEmitter();
let listenersAdded = false; // Track if event listeners are added

export function getMpvInstance(): MPV {
  if (!mpv) {
    mpv = new MPV({
      audio_only: true,
      verbose: true,
    });

    // Start MPV
    mpv.start().catch((err) => {
      console.error("Failed to start MPV:", err);
    });
  }

  // Ensure listeners are added only once
  if (!listenersAdded) {
    mpv.on("crashed", () => mpvEvents.emit("crashed"));
    mpv.on("seek", (pos) => mpvEvents.emit("seek", pos));
    mpv.on("started", () => mpvEvents.emit("started"));
    mpv.on("stopped", () => mpvEvents.emit("stopped"));
    mpv.on("paused", () => mpvEvents.emit("paused"));
    mpv.on("resumed", () => mpvEvents.emit("resumed"));
    mpv.on("status", (status) => mpvEvents.emit("status", status));
    mpv.on("timeposition", (sec) => mpvEvents.emit("timeposition", sec));
    mpv.on("quit", () => mpvEvents.emit("quit"));
    listenersAdded = true; // Mark that listeners are added
  }

  return mpv;
}

export function getMpvEvents(): EventEmitter {
  return mpvEvents;
}
