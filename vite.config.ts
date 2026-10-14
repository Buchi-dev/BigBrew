import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    command === "build" ? nitro() : undefined,
  ],
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": "/src",
    },
  },
  define: Object.fromEntries(
    Object.entries(process.env)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
  ),
  server: {
    host: "::",
    port: 8080,
  },
}));
