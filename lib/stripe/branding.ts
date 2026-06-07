import { businessInfo } from "@/lib/services-data"
import { absoluteUrl } from "@/lib/site-config"

/** Rootline palette — avoid default Stripe/Dashboard green on hosted Checkout. */
export const ROOTLINE_STRIPE_BRAND = {
  displayName: businessInfo.name,
  backgroundColor: "#f7f4ed",
  buttonColor: "#c45a3a",
  borderStyle: "rounded" as const,
  logoUrl: absoluteUrl("/images/logo-navbar.png"),
}

export function getCheckoutBrandingSettings() {
  return {
    display_name: ROOTLINE_STRIPE_BRAND.displayName,
    background_color: ROOTLINE_STRIPE_BRAND.backgroundColor,
    button_color: ROOTLINE_STRIPE_BRAND.buttonColor,
    border_style: ROOTLINE_STRIPE_BRAND.borderStyle,
    logo: {
      type: "url" as const,
      url: ROOTLINE_STRIPE_BRAND.logoUrl,
    },
  }
}
