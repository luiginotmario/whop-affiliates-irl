import { Button, Card, Heading, Text } from "frosted-ui";

export function SignInPrompt({ next }: { next: string }) {
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
