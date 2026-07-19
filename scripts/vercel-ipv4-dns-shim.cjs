const dns = require("node:dns");

const pinned = new Map([
  ["vercel.com", { address: "64.239.123.193", family: 4 }],
  ["api.vercel.com", { address: "76.76.21.112", family: 4 }],
]);

const originalLookup = dns.lookup.bind(dns);
const originalPromisesLookup = dns.promises.lookup.bind(dns.promises);

function normalizeOptions(options, callback) {
  if (typeof options === "function") return [{}, options];
  return [options ?? {}, callback];
}

dns.lookup = function lookup(hostname, options, callback) {
  const [resolvedOptions, resolvedCallback] = normalizeOptions(options, callback);
  const pin = pinned.get(String(hostname).toLowerCase());
  if (!pin || typeof resolvedCallback !== "function") {
    return originalLookup(hostname, options, callback);
  }
  if (resolvedOptions.all) {
    process.nextTick(resolvedCallback, null, [pin]);
    return;
  }
  process.nextTick(resolvedCallback, null, pin.address, pin.family);
};

dns.promises.lookup = async function lookupPromise(hostname, options) {
  const pin = pinned.get(String(hostname).toLowerCase());
  if (!pin) return originalPromisesLookup(hostname, options);
  if (options?.all) return [pin];
  return pin;
};
