import { redirect } from "next/navigation";
import { RESHELL_ROUTES } from "@/routing/routes";

export default function RootPage() {
  redirect(RESHELL_ROUTES.homeStation);
}
