import { Suspense } from "react";
import { Explore } from "@/components/Explore";

export default function HomePage() {
  // Explore reads ?place= to restore a selection, and useSearchParams needs a
  // boundary for the shell to prerender.
  return (
    <Suspense fallback={null}>
      <Explore />
    </Suspense>
  );
}
