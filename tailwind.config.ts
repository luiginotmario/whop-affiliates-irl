import type { Config } from "tailwindcss";
import { frostedThemePlugin } from "frosted-ui/tailwind-plugin";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [frostedThemePlugin()],
} satisfies Config;
