import Resolver from "@polyzone/runtime/src/Resolver";
import { afterEach } from "vitest";

afterEach(() => {
  Resolver.deregisterAllFileSystems();
});
