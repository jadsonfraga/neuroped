import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getAccessLevel } from "@/security/accessPolicy";
import { LocalUnlockGate } from "@/components/LocalUnlockGate";
import { hasClinicalUnlock, localUnlockEventName } from "@/lib/localUnlock";

interface SensitiveRouteGateProps {
  children: React.ReactNode;
}

export function SensitiveRouteGate({ children }: SensitiveRouteGateProps) {
  const [location] = useLocation();
  const [unlocked, setUnlocked] = useState(() => hasClinicalUnlock());
  const accessLevel = getAccessLevel(location);

  useEffect(() => {
    function handleLockEvent(event: Event) {
      const detail = (event as CustomEvent<{ unlocked?: boolean }>).detail;
      setUnlocked(Boolean(detail?.unlocked));
    }

    window.addEventListener(localUnlockEventName, handleLockEvent);
    return () => window.removeEventListener(localUnlockEventName, handleLockEvent);
  }, []);

  if (accessLevel !== "clinical") return <>{children}</>;
  if (unlocked) return <>{children}</>;

  return <LocalUnlockGate onUnlocked={() => setUnlocked(true)} />;
}
