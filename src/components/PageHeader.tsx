import { Heading, Text } from "frosted-ui";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="text-center">
      <Heading as="h1" size="7" weight="bold">
        {title}
      </Heading>
      <Text as="p" size="3" color="gray" className="mt-1.5">
        {subtitle}
      </Text>
    </header>
  );
}
