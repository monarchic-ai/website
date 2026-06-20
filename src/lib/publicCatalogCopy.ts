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
  return description;
}
