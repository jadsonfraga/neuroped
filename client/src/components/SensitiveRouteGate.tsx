import { useLocation } from "wouter";
import { getAccessLevel } from "@/security/accessPolicy";
import { RouteGuard } from "@/components/RouteGuard";

interface SensitiveRouteGateProps {
  children: React.ReactNode;
}

export function SensitiveRouteGate({ children }: SensitiveRouteGateProps) {
  const [location] = useLocation();
  const accessLevel = getAccessLevel(location);

  if (accessLevel !== "clinical") return <>{children}</>;

  return <RouteGuard>{children}</RouteGuard>;
}
