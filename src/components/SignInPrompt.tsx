import { Button, Card, Heading, Text } from "frosted-ui";

export function SignInPrompt({
  next,
  signedIn,
}: {
  next: string;
  signedIn: boolean;
}) {
  // Signed in but no partner record means the app is missing the
  // partner:create permission — a dashboard fix, not a retry.
  if (signedIn) {
    return (
      <Card size="3" variant="surface" className="w-full">
        <Heading as="h2" size="4" weight="bold">
          QR not available yet
        </Heading>
        <Text as="p" size="2" color="gray" className="mt-2">
          You&apos;re signed in, but this app can&apos;t enrol you as a partner
          yet. Add the <strong>partner:create</strong> permission on the app in
          the Whop developer dashboard, then sign in again.
        </Text>
      </Card>
    );
  }

  return (
    <Card size="3" variant="surface" className="w-full">
      <Heading as="h2" size="4" weight="bold">
        Sign in to get your QR
      </Heading>
      <Text as="p" size="2" color="gray" className="mt-2">
        Your referral link carries your Whop username, so the businesses you
        sign are credited to you.
      </Text>
      <a
        href={`/api/auth/login?next=${encodeURIComponent(next)}`}
        className="mt-5 block"
      >
        <Button size="3" variant="solid" color="blue" className="w-full">
          Sign in with Whop
        </Button>
      </a>
    </Card>
  );
}
