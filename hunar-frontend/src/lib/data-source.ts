export type DataSourceMode = "mock" | "api";

export function getDataSourceMode(): DataSourceMode {
  const mode = process.env.NEXT_PUBLIC_API_MODE;
  return mode === "api" ? "api" : "mock";
}

export const DATA_SOURCE_MODE: DataSourceMode = getDataSourceMode();

export function isMockMode(): boolean {
  return DATA_SOURCE_MODE === "mock";
}

export const mockLatencyMin = 350;
export const mockLatencyMax = 900;

export function simulateLatency<T>(
  value: T,
  min = mockLatencyMin,
  max = mockLatencyMax,
): Promise<T> {
  const delay = Math.floor(min + Math.random() * (max - min));
  return new Promise((resolve) => setTimeout(() => resolve(value), delay));
}

export function createMockError(message: string): never {
  throw new Error(message);
}