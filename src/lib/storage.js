// Everything is saved in this browser only (localStorage).
// Nothing is sent to a server. If storage is blocked or full,
// we fall back to memory so the app keeps working for the session.

const KEY = 'crinkletales:v1';
let memory = null;

const empty = () => ({
  entries: [],
  settings: { name: '', sound: true, introSeen: false },
});

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return memory || empty();
    const data = JSON.parse(raw);
    return { ...empty(), ...data, settings: { ...empty().settings, ...data.settings } };
  } catch {
    return memory || empty();
  }
}

// Returns true if saved to the device, false if only kept in memory.
export function save(data) {
  memory = data;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function wipe() {
  memory = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

export const uid = () => Math.random().toString(36).slice(2, 10);
