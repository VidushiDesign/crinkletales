// Behaviour analytics. Never sends what people write, only what they do.
// Saturday: add the GoatCounter script tag to index.html and these
// events start showing up in the dashboard. Until then they are no-ops.

export function track(name, props = {}) {
  try {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({
        path: `event/${name}`,
        title: Object.entries(props)
          .map(([k, v]) => `${k}=${v}`)
          .join(' '),
        event: true,
      });
    }
    if (import.meta.env.DEV) console.debug('[track]', name, props);
  } catch {
    /* analytics must never break the app */
  }
}
