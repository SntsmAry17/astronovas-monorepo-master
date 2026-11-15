import HomeExperience from "@/components/HomeExperience";
import { SITE_SUMMARIES } from "@/lib/sites";

export default function Home() {
  return <HomeExperience sites={SITE_SUMMARIES} />;
}
