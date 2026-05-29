/** Opens a place search in Google Maps (works on mobile and desktop). */
export function googleMapsSearchUrl(address: string): string {
  const query = encodeURIComponent(address.trim())
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
