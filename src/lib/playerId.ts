/** Derives a stable, short player id from a device id. Shared by client and server so both agree on identity without any extra round trip. */
export function deriveShortPlayerId(deviceId: string): string {
  return `p_${deviceId.slice(0, 8)}`;
}
