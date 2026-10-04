// app/import/page.tsx
import { PGNImport } from "@/components/PGNImport";

export const metadata = {
  title: "حلل مباراتك — Outplay",
};

export default function ImportPage() {
  return <PGNImport />;
}
