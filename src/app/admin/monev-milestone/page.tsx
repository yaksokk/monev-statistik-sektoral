import { ambilMilestone } from "@/lib/data/monev";
import MonevMilestoneClient from "./MonevMilestoneClient";

export default async function MonevMilestonePage() {
  const milestoneList = await ambilMilestone();
  return <MonevMilestoneClient milestoneList={milestoneList} />;
}