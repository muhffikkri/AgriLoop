import { SiteFooter } from "@/components/layout/SiteFooter.tsx";
import { SiteHeader } from "@/components/layout/SiteHeader.tsx";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
