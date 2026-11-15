import MissionApp from "@/components/MissionApp";
import { MISSION_SITES } from "@/lib/sites";

export const metadata = {
  title: "Find by Mission — AstroNovas TerraAnalog",
  description: "Pick a planetary research objective and rank the eight terrestrial analog sites for it.",
};

export default function MissionPage() {
  return <MissionApp sites={MISSION_SITES} />;
}
