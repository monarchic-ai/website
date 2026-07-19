const PUBLIC_ORIGIN = "https://staging.monarchic.io";
const UPSTREAM_ORIGIN = "https://website-staging-lac.vercel.app";

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(`${incomingUrl.pathname}${incomingUrl.search}`, UPSTREAM_ORIGIN);
    const upstreamRequest = new Request(upstreamUrl, request);
    const upstreamResponse = await fetch(upstreamRequest, { redirect: "manual" });
    const headers = new Headers(upstreamResponse.headers);

    headers.set("X-Robots-Tag", "noindex, nofollow");

    const location = headers.get("location");
    if (location?.startsWith(UPSTREAM_ORIGIN)) {
      headers.set("location", `${PUBLIC_ORIGIN}${location.slice(UPSTREAM_ORIGIN.length)}`);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
