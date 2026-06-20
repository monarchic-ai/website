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
