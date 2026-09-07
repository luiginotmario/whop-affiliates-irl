"use client";

import { useState } from "react";
import { Button, Dialog, Text, TextField } from "frosted-ui";
import { QrClose } from "@/components/QrClose";

/** Builds the business server-side, then shows the claim QR in the same modal
 *  the referral close uses. Nothing is created until Build is pressed, so a
 *  pitch that goes nowhere leaves nothing behind. */
export function Autopilot({
  placeId,
  businessName,
}: {
  placeId: string;
  businessName: string;
}) {
  const [email, setEmail] = useState("");
  const [building, setBuilding] = useState(false);
  const [claim, setClaim] = useState<{ url: string; qr: string } | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function build() {
    setBuilding(true);
    setError(null);
    try {
      const res = await fetch("/api/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId, email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't build the business");
      setClaim({ url: json.claimUrl, qr: json.qrDataUrl });
      setShowQr(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't build it");
    } finally {
      setBuilding(false);
    }
  }

  if (claim) {
    return (
      <>
        <Button
          size="4"
          variant="solid"
          color="blue"
          className="w-full transition-transform duration-150 active:scale-[0.98]"
          onClick={() => setShowQr(true)}
        >
          Show claim QR
        </Button>
        <QrClose
          qrDataUrl={claim.qr}
          referralLink={claim.url}
          title={`${businessName} is built`}
          description="They scan, verify who they are, and it's theirs. You're recorded as the partner who referred them."
          open={showQr}
          onOpenChange={setShowQr}
        />
      </>
    );
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <Button
          size="4"
          variant="solid"
          color="blue"
          className="w-full transition-transform duration-150 active:scale-[0.98]"
        >
          Build their Whop
        </Button>
      </Dialog.Trigger>
      <Dialog.Content className="max-w-sm">
        <Dialog.Title>Build {businessName}</Dialog.Title>
        <Dialog.Description>
          <Text size="2" color="gray">
            We build their Whop now and show a QR for them to claim it.
          </Text>
        </Dialog.Description>

        <div className="mt-5 flex flex-col gap-3">
          <TextField.Root size="3" variant="surface">
            <TextField.Input
              type="email"
              placeholder="Owner's email (for the account record)"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </TextField.Root>

          {error ? (
            <Text size="2" color="danger">
              {error}
            </Text>
          ) : null}

          <Button
            size="3"
            variant="solid"
            color="blue"
            className="w-full"
            loading={building}
            disabled={!email.includes("@")}
            onClick={build}
          >
            Build it
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
