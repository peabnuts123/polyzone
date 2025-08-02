import { clearTauriMock, mockTauri } from "@lib/tauri/mock";
import { afterEach, beforeEach } from "vitest";

beforeEach(() => {
  mockTauri();
});

afterEach(() => {
  clearTauriMock();
});
