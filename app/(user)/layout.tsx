import { UserLayoutShell } from "@/components/UserLayoutShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <UserLayoutShell>{children}</UserLayoutShell>;
}
