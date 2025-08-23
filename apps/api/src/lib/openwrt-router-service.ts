import { TRPCError } from "@trpc/server";
import "dotenv/config";

// Configuration interface (unchanged)
interface OpenWRTConfig {
  baseUrl: string;
  username: string;
  password: string;
}

interface LuciResponse<T> {
  id: number;
  result: T;
  error?: { code: number; message: string };
}

// Custom error for service-level issues
class OpenWRTServiceError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "OpenWRTServiceError";
    this.code = code;
  }
}

interface Logger {
  info(message: string): void;
  error(message: string, error?: unknown): void;
}

export class OpenWRTRouterService {
  private config: OpenWRTConfig;
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private logger: Logger;

  constructor(config: OpenWRTConfig, logger: Logger = console) {
    this.config = config;
    this.logger = logger;
  }

  // --- Private Helpers ---
  private async fetchAuthToken(): Promise<string> {
    try {
      const res = await fetch(`${this.config.baseUrl}/cgi-bin/luci/rpc/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "login",
          params: [this.config.username, this.config.password],
          id: 1,
        }),
      });

      if (!res.ok) {
        throw new OpenWRTServiceError(
          `Auth request failed: ${res.statusText}`,
          "AUTH_FAILED"
        );
      }

      const data: LuciResponse<string> = await res.json();
      if (data.error) {
        throw new OpenWRTServiceError(data.error.message, "AUTH_ERROR");
      }

      this.token = data.result;
      this.tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
      this.logger.info("Successfully fetched auth token");
      return this.token;
    } catch (error) {
      this.logger.error("Failed to fetch auth token", error);
      throw error;
    }
  }

  private async getToken(): Promise<string> {
    if (!this.token || !this.tokenExpiry || Date.now() >= this.tokenExpiry) {
      return this.fetchAuthToken();
    }
    return this.token;
  }

  private async call<T>(
    endpoint: "sys" | "fs" | "uci",
    method: string,
    params: any[] = []
  ): Promise<T> {
    try {
      const token = await this.getToken();
      const url = `${this.config.baseUrl}/cgi-bin/luci/rpc/${endpoint}?auth=${token}`;
      const body = JSON.stringify({ method, params });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.status === 403) {
        this.logger.info("Token expired, refreshing and retrying");
        await this.fetchAuthToken();
        return this.call(endpoint, method, params); // Retry once
      }

      if (!res.ok) {
        throw new OpenWRTServiceError(
          `HTTP ${res.status}: ${res.statusText}`,
          "HTTP_ERROR"
        );
      }

      const data: LuciResponse<T> = await res.json();
      if (data.error) {
        throw new OpenWRTServiceError(data.error.message, "RPC_ERROR");
      }

      return data.result;
    } catch (error) {
      this.logger.error(`RPC call failed: ${endpoint}.${method}`, error);
      throw error instanceof OpenWRTServiceError
        ? error
        : new OpenWRTServiceError(
            "Unexpected error during RPC call",
            "UNKNOWN_ERROR"
          );
    }
  }

  // --- Public Service Methods ---
  async getSystemStatus(): Promise<{
    uptime: string;
    temperature: number; // Parsed to Celsius
    load: { avg1: number; avg5: number; avg15: number };
  }> {
    try {
      const [uptime, tempBase64, loadBase64] = await Promise.all([
        this.call<string>("sys", "uptime"),
        this.call<string>("fs", "readfile", [
          "/sys/class/thermal/thermal_zone0/temp",
        ]),
        this.call<string>("fs", "readfile", ["/proc/loadavg"]),
      ]);

      const temperature =
        parseInt(Buffer.from(tempBase64, "base64").toString()) / 1000; // Convert to Celsius

      const load = Buffer.from(loadBase64, "base64").toString();
      const [avg1, avg5, avg15] = load
        .split(" ")
        .slice(0, 3)
        .map((val) => parseFloat(val));

      return { uptime, temperature, load: { avg1, avg5, avg15 } };
    } catch (error) {
      this.logger.error("Failed to fetch system status", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch system status",
        cause: error,
      });
    }
  }

  async rebootRouter(): Promise<void> {
    try {
      await this.call("sys", "reboot");
      this.logger.info("Router reboot initiated");
    } catch (error) {
      this.logger.error("Failed to reboot router", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to reboot router",
        cause: error,
      });
    }
  }

  async isProcessRunning(processName: string): Promise<boolean> {
    try {
      const result = await this.call<string>("sys", "call", [
        `pgrep ${processName} >/dev/null 2>&1`,
      ]);
      return !Boolean(Number(result));
    } catch (error) {
      this.logger.error(
        `Failed to check process status for ${processName}`,
        error
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check process status",
        cause: error,
      });
    }
  }

  async manageInitdProcess(
    processName: string,
    action: "start" | "stop" | "enable" | "disable"
  ): Promise<void> {
    try {
      await this.call("sys", `init.${action}`, [processName]);
      this.logger.info(`Init.d process ${processName} ${action}d`);
    } catch (error) {
      this.logger.error(
        `Failed to manage init.d process ${processName} ${action}`,
        error
      );
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to manage init.d process ${processName} ${action}`,
        cause: error,
      });
    }
  }
}
