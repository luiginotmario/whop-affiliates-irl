"use client";

import { useEffect, useState } from "react";
import { Button } from "frosted-ui";

/** Copies the URL the QR encodes, so it can be opened on a desktop — handy for
 *  a demo where nobody is holding a phone. */
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      size="2"
      variant="ghost"
      color="gray"
      className="w-full"
      onClick={() => {
        void navigator.clipboard.writeText(url).then(() => setCopied(true));
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
