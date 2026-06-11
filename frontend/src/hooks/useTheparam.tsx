import { usePathname } from "next/navigation";
import { useMemo } from "react";
type Path = "home" | "vendor";

export function useTheparam (): Path {
  const path = usePathname()

  return useMemo(() => {
    if (!path || path === "/") return "home";
    const firstpart = path.split("/")[1];
    if (firstpart === "vendor") return "vendor";
    return "home";
  }, [path]);
};