import type { Metadata, Viewport } from "next";
import { Theme } from "frosted-ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scout",
  description: "Know what to say before you walk in.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Theme appearance="light" accentColor="blue" grayColor="gray">
          <main className="mx-auto flex h-dvh w-full max-w-xl flex-col px-6">
            {children}
          </main>
        </Theme>
      </body>
    </html>
  );
}
