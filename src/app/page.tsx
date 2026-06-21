import { redirect } from "next/navigation";
import { auth, isAllowedEmail } from "@/auth";
import { ResearchWorkbench } from "@/components/research-workbench";

export default async function Home() {
  const session = await auth();
  const email = session?.user?.email;

  if (!isAllowedEmail(email)) redirect("/login");

  return <ResearchWorkbench userEmail={email} />;
}
