type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

function createEntry(level: LogLevel, message: string, data?: unknown): LogEntry {
  return { level, message, timestamp: new Date().toISOString(), data };
}

function writeLog(entry: LogEntry): void {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;

  if (process.env.NODE_ENV === "development") {
    const fn =
      entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.log;
    fn(prefix, entry.data !== undefined ? entry.data : "");
  } else if (entry.level === "error") {
    console.error(prefix, entry.data !== undefined ? entry.data : "");
  }
}

export function error(message: string, data?: unknown): void {
  writeLog(createEntry("error", message, data));
}

export function warn(message: string, data?: unknown): void {
  writeLog(createEntry("warn", message, data));
}

export function info(message: string, data?: unknown): void {
  writeLog(createEntry("info", message, data));
}
