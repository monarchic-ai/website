export function publicPilotFeatureBullet(bullet: string): string {
  if (bullet === "Cancel anytime through the Stripe billing portal") {
    return "Pilot access coordinated through the Monarchic app";
  }
  if (bullet === "Single subscription, single bill") {
    return "Single pilot scope and deployment handoff";
  }
  if (bullet === "Single subscription when launched") {
    return "Single pilot scope when launched";
  }
  if (bullet === "Every Monarchic MCP, today and future") {
    return "Every pilot-ready Monarchic MCP";
  }
  return bullet;
}

export function publicPilotDescription(description: string): string {
  return description.replace(
    "Join the waitlist and we'll reach out when it's ready to charge for.",
    "Join the waitlist and we'll reach out when pilot access opens.",
  );
}
