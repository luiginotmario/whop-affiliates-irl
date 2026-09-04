import type { Config } from "tailwindcss";
import { frostedThemePlugin } from "frosted-ui/tailwind-plugin";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // The plugin ships colors and type but no radius scale, so `rounded-3`
      // silently did nothing. Map Frosted's own radius vars onto Tailwind.
      borderRadius: {
        1: "var(--radius-1)",
        2: "var(--radius-2)",
        3: "var(--radius-3)",
        4: "var(--radius-4)",
        5: "var(--radius-5)",
        6: "var(--radius-6)",
      },
    },
  },
  plugins: [frostedThemePlugin()],
} satisfies Config;
