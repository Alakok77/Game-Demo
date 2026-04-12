export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem("userId");

  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem("userId", id);
  }

  return id;
}

export function getStorageKey(key: string): string {
  if (typeof window === "undefined") return key;
  const userId = getUserId();
  return `${key}_${userId}`;
}

export function saveData<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(key), JSON.stringify(data));
}

export function loadData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`Failed to load data for key ${key}`, err);
    return fallback;
  }
}

export function removeData(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(key));
}

export function resetUserData(): void {
  if (typeof window === "undefined") return;
  const userId = getUserId();

  Object.keys(window.localStorage).forEach((key) => {
    if (key.endsWith(`_${userId}`)) {
      window.localStorage.removeItem(key);
    }
  });
}
