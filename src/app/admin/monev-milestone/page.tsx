import { MILESTONE_LIST } from "@/data/monev-milestone";
import MonevMilestoneClient from "./MonevMilestoneClient";

export default function MonevMilestonePage() {
  return <MonevMilestoneClient milestoneList={MILESTONE_LIST} />;
}