import MPV from "node-mpv";
import { EventEmitter } from "events";

export class MpvService extends EventEmitter {
  private mpv: MPV;
  //   private isInitialized: boolean = false;

  constructor(options = { audio_only: true }, mpvArgs: string[] = []) {
    super();
    this.mpv = new MPV(options, mpvArgs);

    this.setupEventListeners();
    this.setupShutdownHooks();
  }

  private setupEventListeners(): void {
    this.mpv.on("status", (status) => {
      this.emit("status", status);
    });

    this.mpv.on("stopped", () => {
      setTimeout(() => {
        this.quit().catch((err) =>
          console.error("Failed to quit on stopped:", err)
        );
      }, 1000 * 60 * 10);
      this.emit("stopped");
    });

    this.mpv.on("paused", () => {
      this.emit("paused");
    });

    this.mpv.on("started", () => {
      this.emit("started");
    });

    this.mpv.on("crashed", () => {
      this.emit("crashed");
    });

    this.mpv.on("quit", () => {
      //   this.isInitialized = false;
      this.emit("quit");
    });
  }
  private setupShutdownHooks(): void {
    const shutdown = () => {
      this.quit()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  private async ensureStarted(): Promise<void> {
    if (!this.mpv.isRunning()) {
      try {
        await this.mpv.start();
        // this.isInitialized = true;
      } catch (error) {
        throw new Error(`Failed to start MPV: ${error}`);
      }
    }
  }

  async quit(): Promise<void> {
    try {
      await this.mpv.quit();
      //   this.isInitialized = false;
    } catch (error) {
      throw new Error(`Failed to quit MPV: ${error}`);
    }
  }

  async load(
    content: string,
    mode: "replace" | "append" | "append-play" = "replace",
    options: string[] | undefined = undefined
  ): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.load(content, mode, options);
    } catch (error) {
      throw new Error(`Failed to load content: ${error}`);
    }
  }

  async play(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.play();
    } catch (error) {
      throw new Error(`Failed to play: ${error}`);
    }
  }

  async pause(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.pause();
    } catch (error) {
      throw new Error(`Failed to pause: ${error}`);
    }
  }

  async togglePause(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.togglePause();
    } catch (error) {
      throw new Error(`Failed to toggle pause: ${error}`);
    }
  }

  async stop(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.stop();
    } catch (error) {
      throw new Error(`Failed to stop: ${error}`);
    }
  }

  async next(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.next();
    } catch (error) {
      throw new Error(`Failed to stop: ${error}`);
    }
  }

  async prev(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.prev();
    } catch (error) {
      throw new Error(`Failed to stop: ${error}`);
    }
  }

  async volume(level: number): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.volume(level);
    } catch (error) {
      throw new Error(`Failed to set volume: ${error}`);
    }
  }

  async mute(set: boolean | undefined = undefined): Promise<void> {
    await this.ensureStarted();
    try {
      await this.mpv.mute(set);
    } catch (error) {
      throw new Error(`Failed to set mute state: ${error}`);
    }
  }

  async getDuration(): Promise<number> {
    await this.ensureStarted();
    try {
      return await this.mpv.getDuration();
    } catch (error) {
      throw new Error(`Failed to get duration: ${error}`);
    }
  }

  async getProperty(property: string): Promise<any> {
    await this.ensureStarted();
    try {
      return await this.mpv.getProperty(property);
    } catch (error) {
      throw new Error(`Failed to get property ${property}: ${error}`);
    }
  }

  async getAllProperties(properties: string[]): Promise<Record<string, any>> {
    await this.ensureStarted();
    try {
      const results: Record<string, any> = {};
      for (const property of properties) {
        try {
          results[property] = await this.mpv.getProperty(property);
        } catch (error) {
          results[property] = null; // Handle individual property errors
        }
      }
      return results;
    } catch (error) {
      throw new Error(`Failed to get properties: ${error}`);
    }
  }

  isRunning(): boolean {
    return this.mpv.isRunning();
  }
}
