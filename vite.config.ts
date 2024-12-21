import { resolve, } from "path";
import { defineConfig, } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        "init-api": resolve("examples", "init-api", "index.html")
      },
    },
  },
});
