import { useEffect, useState } from "react";

export function useLocalStorageBooleanState(
  key: string,
  initialValue: boolean,
): [boolean, (next: boolean) => void] {
  const [value, setValue] = useState<boolean>(() => {
    const raw = localStorage.getItem(key);
    if (raw == null) return initialValue;
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
    return initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, value ? "1" : "0");
  }, [key, value]);

  return [value, setValue];
}
