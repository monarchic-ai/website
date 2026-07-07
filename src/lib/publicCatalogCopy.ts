export function publicCatalogFeatureBullet(bullet: string): string {
  if (bullet === "Cancel anytime through the Stripe billing portal") {
    return "Manage billing from the account surface";
  }
  if (bullet === "Single subscription, single bill") {
    return "Single subscription and account-scoped access";
  }
  if (bullet === "Single subscription when launched") {
    return "Single subscription when launched";
  }
  if (bullet === "Every Monarchic MCP, today and future") {
    return "Every available Monarchic MCP";
  }
  return bullet;
}

export function publicCatalogDescription(description: string): string {
  if (description === "The full Monarchic agent system on top of the hosted MCP stack. Autonomous, observable, infrastructure-backed agent runs with the entire Monarchic toolchain wired in. Join the waitlist and we'll reach out when launch access opens.") {
    return "Monarchic is the larger autonomous development platform we are building toward. It is not available yet. The MCP catalog is the current focus.";
  }
  const hostedRouteMatch = description.match(/^(.+?) is part of the hosted Monarchic MCP catalog\./);
  if (hostedRouteMatch) {
    return `${hostedRouteMatch[1]} is part of the hosted Monarchic MCP catalog. Access is gated while account controls and route availability move through release checks.`;
  }
  if (description.includes("usage-plan credit pool")) {
    return description.replace(
      "It maps to the same usage-plan credit pool as the rest of the hosted catalog.",
      "It maps to the same gated access path as the rest of the hosted catalog.",
    );
  }
  if (description.includes("usage-plan credits")) {
    return description.replace(
      "These routes are included under usage-plan credits rather than sold as a separate checkout bundle.",
      "These routes are grouped for gated account access rather than sold from the public website.",
    );
  }
  return description;
}

export function publicCatalogDisplayName(slug: string, displayName: string): string {
  if (slug === "monarchic-ai") return "Monarchic";
  return displayName;
}

export function publicCatalogTagline(slug: string, tagline: string): string {
  if (slug === "monarchic-ai") return "Autonomous development platform, coming later";
  return tagline;
}
