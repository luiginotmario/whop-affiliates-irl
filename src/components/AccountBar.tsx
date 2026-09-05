import { Button, Text } from "frosted-ui";
import { getOptionalUser } from "@/lib/session";

/** Small, always-present proof of who you are signed in as. */
export async function AccountBar() {
  const session = await getOptionalUser();
  if (!session) return null;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <Text size="1" color="gray" className="truncate">
        Signed in{session.username ? ` as ${session.username}` : ""}
      </Text>
      <a href="/api/auth/logout">
        <Button size="1" variant="ghost" color="gray">
          Sign out
        </Button>
      </a>
    </div>
  );
}
