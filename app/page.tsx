import StatusBoard from "@/components/StatusBoard";
import { getStatuses } from "@/lib/providers";

export const revalidate = 60;

export default async function Page() {
  const initial = await getStatuses();
  return <StatusBoard initial={initial} />;
}
