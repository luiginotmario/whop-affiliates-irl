import { type Stack, StackSchema } from "@/lib/schemas";

/** Signatures we can see in a homepage's own HTML. Deliberately narrow:
 *  a wrong guess is worse than no guess when someone repeats it out loud. */
const SIGNATURES: Record<keyof Stack, Record<string, RegExp>> = {
  payments: {
    Stripe: /js\.stripe\.com|stripe\.network/i,
    Square: /squareup\.com|square\.site|squarecdn\.com/i,
    PayPal: /paypal\.com\/sdk|paypalobjects\.com/i,
    Toast: /toasttab\.com/i,
    Clover: /clover\.com|clover\.net/i,
    Adyen: /adyen\.com/i,
  },
  commerce: {
    Shopify: /cdn\.shopify\.com|myshopify\.com/i,
    WooCommerce: /woocommerce|wp-content\/plugins\/woo/i,
    Wix: /wix\.com|wixstatic\.com/i,
    Squarespace: /squarespace\.com|sqspcdn\.com/i,
    Webflow: /webflow\.com|assets\.website-files\.com/i,
    "GoHighLevel": /gohighlevel|msgsndr\.com/i,
  },
  booking: {
    Calendly: /calendly\.com/i,
    Mindbody: /mindbodyonline\.com/i,
    Acuity: /acuityscheduling\.com/i,
    Resy: /resy\.com/i,
    OpenTable: /opentable\.com/i,
    Booksy: /booksy\.com/i,
  },
  marketing: {
    Mailchimp: /mailchimp\.com|list-manage\.com/i,
    Klaviyo: /klaviyo\.com/i,
    "Meta Pixel": /connect\.facebook\.net/i,
    "Google Analytics": /googletagmanager\.com|google-analytics\.com/i,
    Linktree: /linktr\.ee/i,
    Instagram: /instagram\.com\//i,
  },
};

export function detectStack(html: string): Stack {
  const found: Record<string, string[]> = {};
  for (const [group, sigs] of Object.entries(SIGNATURES)) {
    found[group] = Object.entries(sigs)
      .filter(([, pattern]) => pattern.test(html))
      .map(([name]) => name);
  }
  return StackSchema.parse(found);
}

export function stackIsEmpty(stack: Stack): boolean {
  return Object.values(stack).every((list) => list.length === 0);
}

export function summarizeStack(stack: Stack): string {
  const parts = Object.entries(stack)
    .filter(([, list]) => list.length > 0)
    .map(([group, list]) => `${group}: ${list.join(", ")}`);
  return parts.length > 0 ? parts.join(" | ") : "nothing detected";
}
