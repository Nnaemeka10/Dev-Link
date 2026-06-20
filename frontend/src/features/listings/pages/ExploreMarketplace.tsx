"use client";

import { useSearchParams } from "next/navigation";
import ExploreHalls from "./ExploreHalls";
import ExploreServices from "./ExploreServices";

export default function ExploreMarketplace() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "halls";

  if (category === "services") {
    return <ExploreServices />;
  }

  return <ExploreHalls />;
}
