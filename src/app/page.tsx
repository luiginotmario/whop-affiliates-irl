import { PageHeader } from "@/components/PageHeader";
import { Scout } from "@/components/Scout";

export default function HomePage() {
  return (
    <Scout
      header={
        <PageHeader
          title="Where are you walking into?"
          subtitle="We'll tell you what they run and what to say."
        />
      }
    />
  );
}
