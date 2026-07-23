// @lovable.dev/vite-tanstack-config already includes core plugins — do NOT re-add them.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
  vite: {},
});