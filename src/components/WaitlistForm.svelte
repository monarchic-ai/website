<script lang="ts">
  import { onMount } from "svelte";

  let {
    apiBaseUrl,
    slug,
    products = [],
    label = "Email",
    placeholder = "you@example.com",
    submitLabel = "Join waitlist",
  }: {
    apiBaseUrl: string;
    slug: string;
    products?: Array<{ slug: string; label: string }>;
    label?: string;
    placeholder?: string;
    submitLabel?: string;
  } = $props();

  let email = $state("");
  let selectedSlug = $state(slug);
  let submitting = $state(false);
  let successMessage = $state("");
  let errorMessage = $state("");

  onMount(() => {
    const requestedProduct = new URL(window.location.href).searchParams.get("product");
    if (requestedProduct && products.some((product) => product.slug === requestedProduct)) {
      selectedSlug = requestedProduct;
    }
  });

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
        body: JSON.stringify({ email: value, slug: selectedSlug }),
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
    } catch {
      errorMessage = "Could not join the waitlist right now. Please try again.";
    } finally {
      submitting = false;
    }
  }
</script>

<form
  onsubmit={submit}
  class={`grid gap-3 ${products.length > 0 ? "md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)_auto]" : "sm:grid-cols-[minmax(0,1fr)_auto]"}`}
>
  {#if products.length > 0}
    <label class="sr-only" for="waitlist-product-{slug}">Product interest</label>
    <select
      id="waitlist-product-{slug}"
      name="product"
      bind:value={selectedSlug}
      disabled={submitting}
      class="h-12 min-w-0 border-2 border-white bg-black px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-signal disabled:opacity-60"
    >
      {#each products as product}
        <option value={product.slug}>{product.label}</option>
      {/each}
    </select>
  {/if}
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
    class="h-12 border-2 border-white bg-black px-3 text-sm text-white placeholder:text-white/42 focus:outline-none focus:ring-2 focus:ring-signal disabled:opacity-60"
  />
  <button
    type="submit"
    disabled={submitting}
    class="inline-flex h-12 items-center justify-center border-2 border-signal bg-signal px-5 text-xs font-bold uppercase text-black transition hover:bg-signal-soft focus:outline-none focus:ring-2 focus:ring-signal disabled:cursor-not-allowed disabled:opacity-60"
  >
    {submitting ? "Submitting" : submitLabel}
  </button>
</form>
{#if successMessage}
  <p class="mt-3 text-sm leading-6 text-signal" role="status" aria-live="polite">{successMessage}</p>
{/if}
{#if errorMessage}
  <p class="mt-3 text-sm leading-6 text-signal-soft" role="alert">{errorMessage}</p>
{/if}
<p class="mt-3 text-xs leading-5 text-white/48">
  We use this email for Monarchic access updates only. <a class="text-signal hover:text-white" href="/privacy">Privacy notice</a>.
</p>
