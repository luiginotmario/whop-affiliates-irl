import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IconButton } from "frosted-ui";

/** One back affordance, always the same place and size. */
export function BackButton({ href }: { href: string }) {
  return (
    <IconButton
      size="2"
      variant="ghost"
      color="gray"
      aria-label="Back"
      className="self-start transition-transform duration-150 active:scale-[0.97]"
      asChild
    >
      <Link href={href}>
        <ArrowLeft size={18} />
      </Link>
    </IconButton>
  );
}
