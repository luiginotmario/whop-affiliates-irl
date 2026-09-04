import { Text } from "frosted-ui";

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      as="div"
      size="1"
      color="gray"
      weight="medium"
      className="uppercase tracking-wider"
    >
      {children}
    </Text>
  );
}
