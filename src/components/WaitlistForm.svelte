<script lang="ts">
  let {
    apiBaseUrl,
    slug,
    label = "Email",
    placeholder = "you@example.com",
    submitLabel = "Join waitlist",
  }: {
    apiBaseUrl: string;
    slug: string;
    label?: string;
    placeholder?: string;
    submitLabel?: string;
  } = $props();

  let email = $state("");
  let submitting = $state(false);
  let successMessage = $state("");
  let errorMessage = $state("");

  async function submit(event: Event) {
    event.preventDefault();
    const value = email.trim();
    if (value.length === 0) {
      errorMessage = "Email is required.";
      return;
    }
    submitting = true;
    errorMessage = "";
    successMessage = "";
    try {
      const url = new URL("/v1/marketplace/waitlist", apiBaseUrl).toString();
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value, slug }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { accepted?: boolean; alreadyOnWaitlist?: boolean; message?: string }
        | null;
      if (!response.ok || !payload?.accepted) {
        errorMessage = payload?.message ?? "Could not join the waitlist. Try again.";
        return;
      }
      successMessage = payload.alreadyOnWaitlist
        ? "You're already on the waitlist. We'll be in touch."
        : "Thanks. You're on the waitlist.";
      email = "";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Could not reach the waitlist endpoint.";
    } finally {
      submitting = false;
    }
  }
</script>

<form onsubmit={submit} class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
  <label class="sr-only" for="waitlist-email-{slug}">{label}</label>
  <input
    id="waitlist-email-{slug}"
    name="email"
    type="email"
    autocomplete="email"
    required
    placeholder={placeholder}
    bind:value={email}
    disabled={submitting}
    class="h-12 border-2 border-white bg-black px-3 text-sm text-white placeholder:text-white/42 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
  />
  <button
    type="submit"
    disabled={submitting}
    class="inline-flex h-12 items-center justify-center border-2 border-cyan-300 bg-cyan-300/10 px-5 text-xs font-bold uppercase text-cyan-100 transition hover:bg-cyan-300/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {submitting ? "Submitting" : submitLabel}
  </button>
</form>
{#if successMessage}
  <p class="mt-3 text-sm leading-6 text-emerald-200" role="status" aria-live="polite">{successMessage}</p>
{/if}
{#if errorMessage}
  <p class="mt-3 text-sm leading-6 text-amber-100" role="alert">{errorMessage}</p>
{/if}
<p class="mt-3 text-xs leading-5 text-white/48">
  We use this email for Monarchic access updates only. <a class="text-cyan-200 hover:text-white" href="/privacy">Privacy notice</a>.
</p>
