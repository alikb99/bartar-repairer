import {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Tv,
  MonitorSmartphone,
  Gamepad2,
  Newspaper,
  MapPin,
  Building2,
  GraduationCap,
  Home,
  Info,
  Phone,
  type LucideProps,
} from "lucide-react";

const MAP = {
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Tv,
  MonitorSmartphone,
  Gamepad2,
  Newspaper,
  MapPin,
  Building2,
  GraduationCap,
  Home,
  Info,
  Phone,
} as const;

export type IconName = keyof typeof MAP;

export default function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = MAP[name as IconName] ?? Smartphone;
  return <Cmp {...props} />;
}
