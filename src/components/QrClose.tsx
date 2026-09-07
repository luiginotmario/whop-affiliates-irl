"use client";

import Image from "next/image";
import { Button, Dialog, Text } from "frosted-ui";

/** The close. The QR is rendered server-side and inlined as a data URL, so it
 *  opens with no network — shop wifi is usually unusable and this is the one
 *  screen that must never fail. */
export function QrClose({
  qrDataUrl,
  referralLink,
  title = "Scan to join Whop",
  description = "They scan, they onboard, you get credited.",
  triggerLabel = "Show your QR",
  open,
  onOpenChange,
}: {
  qrDataUrl: string;
  referralLink: string;
  title?: string;
  description?: string;
  triggerLabel?: string;
  /** Omit for the default trigger-button form; pass to drive it yourself,
   *  which is how Autopilot opens it straight after building. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const controlled = open !== undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {controlled ? null : (
        <Dialog.Trigger>
          <Button
            size="4"
            variant="solid"
            color="blue"
            className="w-full transition-transform duration-150 active:scale-[0.98]"
          >
            {triggerLabel}
          </Button>
        </Dialog.Trigger>
      )}
      <Dialog.Content className="max-w-sm">
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Description>
          <Text size="2" color="gray">
            {description}
          </Text>
        </Dialog.Description>

        <div className="my-5 flex justify-center">
          <div className="rounded-6 bg-white p-3">
            <Image
              src={qrDataUrl}
              alt={title}
              width={240}
              height={240}
              unoptimized
              priority
            />
          </div>
        </div>

        <Text as="div" size="1" color="gray" align="center" className="break-all">
          {referralLink}
        </Text>

        <div className="mt-5">
          <Dialog.Close>
            <Button size="3" variant="soft" color="gray" className="w-full">
              Done
            </Button>
          </Dialog.Close>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
