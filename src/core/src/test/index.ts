import { Context } from "@polyzone/core/Context";

export function polyzoneSetup(): void {
  console.log(`[DEBUG] (${polyzoneSetup.name})`);
}

export function polyzoneTeardown(): void {
  console.log(`[DEBUG] (${polyzoneTeardown.name})`);
  Context.clear();
}
