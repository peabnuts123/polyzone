export function isRunningInBrowser(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (window as any).__TAURI__ === undefined;
}

export function isRunningInTauri(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return (window as any).__TAURI__ !== undefined;
}
