const siteUrl = (import.meta.env.PUBLIC_MONARCHIC_WEBSITE_BASE_URL ?? "https://monarchic.io").replace(/\/$/, "");
const isNonProduction = siteUrl !== "https://monarchic.io";

export function GET() {
  return new Response(
    [
      "User-agent: *",
      isNonProduction ? "Disallow: /" : "Allow: /",
      "",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      "",
    ].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
