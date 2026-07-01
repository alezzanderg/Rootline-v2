export const services = {
  "lawn-care": {
    name: "Lawn Care",
    title: "Professional Lawn Care Services",
    description: "Complete lawn care services including mowing, trimming, edging, and blowing to keep your lawn looking its best year-round.",
    features: [
      "Weekly & bi-weekly lawn mowing",
      "Professional trimming & edging",
      "Debris blowing & cleanup",
      "Consistent scheduling",
      "Residential & small commercial",
      "Free estimates",
    ],
  },
  "lawn-mowing": {
    name: "Lawn Mowing",
    title: "Professional Lawn Mowing Services",
    description: "Expert lawn mowing services with precision cutting, trimming, edging, and blowing for a clean, well-maintained lawn every time.",
    features: [
      "Precision mowing at optimal height",
      "String trimming around obstacles",
      "Clean edging along walkways & driveways",
      "Debris blowing & cleanup",
      "Weekly & bi-weekly options",
      "Reliable scheduling",
    ],
  },
  "leaf-cleanup": {
    name: "Leaf Cleanup",
    title: "Professional Leaf Cleanup & Removal",
    description: "Comprehensive fall leaf cleanup and removal services to keep your property clean and protect your lawn from damage.",
    features: [
      "Complete leaf removal",
      "Bed & shrub cleanup",
      "Debris hauling & disposal",
      "Gutter area cleanup",
      "Fall property preparation",
      "One-time or recurring service",
    ],
  },
  "snow-removal": {
    name: "Snow Removal",
    title: "Snow Removal Services",
    description: "Reliable snow removal services with winter storm availability to keep your property safe and accessible during winter weather.",
    features: [
      "Winter storm availability",
      "Driveway & walkway clearing",
      "Small commercial lot service",
      "Ice management & salting",
      "Residential properties",
      "Seasonal contracts available",
    ],
  },
  "seasonal-cleanup": {
    name: "Seasonal Cleanup",
    title: "Spring & Fall Seasonal Cleanup",
    description: "Thorough seasonal cleanup services to prepare your property for the changing seasons and maintain its curb appeal.",
    features: [
      "Spring debris removal",
      "Fall leaf cleanup",
      "Bed cleanup & preparation",
      "Shrub trimming",
      "Property assessment",
      "Debris removal & disposal",
    ],
  },
  "property-maintenance": {
    name: "Property Maintenance",
    title: "Year-Round Property Maintenance",
    description: "Full-service property maintenance to keep your residential or small commercial property looking its best all year long.",
    features: [
      "Regular lawn maintenance",
      "Shrub & hedge trimming",
      "Debris removal",
      "Seasonal cleanup included",
      "Custom maintenance plans",
      "Rental property service",
    ],
  },
} as const

export const locations = {
  // Hudson County - Primary Service Area
  "hudson-county-nj": {
    name: "Hudson County",
    state: "NJ",
    county: "Hudson County",
    fullName: "Hudson County, New Jersey",
    zip: "07087",
    coordinates: { lat: 40.7282, lng: -74.0776 },
    isPrimary: true,
    intro: `Rootline Landscaping proudly serves Hudson County, NJ with professional lawn care and property maintenance services. From the waterfront communities along the Hudson River to the residential neighborhoods throughout the county, we provide reliable lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service. Our team understands the unique needs of Hudson County properties, from compact urban yards to larger residential lawns. We work with homeowners, landlords, and small commercial property owners who need dependable, professional lawn care on a consistent schedule.`,
    whoWeServe: ["Homeowners", "Landlords", "Small commercial properties", "Rental properties", "Townhome associations"],
    nearby: ["union-city-nj", "jersey-city-nj", "hoboken-nj", "north-bergen-nj", "west-new-york-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Hudson County, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services throughout Hudson County including Union City, Jersey City, Hoboken, and surrounding areas." },
      { q: "Do you provide leaf cleanup in Hudson County?", a: "Yes, we offer complete fall leaf cleanup and removal services for residential and small commercial properties in Hudson County." },
      { q: "Do you offer snow removal in Hudson County?", a: "Yes, we provide snow removal services with winter storm availability for driveways, walkways, and small commercial lots throughout Hudson County." },
      { q: "Can I request weekly or bi-weekly lawn care in Hudson County?", a: "Absolutely. We offer flexible scheduling options including weekly and bi-weekly lawn care service throughout Hudson County." },
    ],
  },
  "union-city-nj": {
    name: "Union City",
    state: "NJ",
    county: "Hudson County",
    fullName: "Union City, New Jersey",
    zip: "07087",
    coordinates: { lat: 40.7795, lng: -74.0246 },
    isPrimary: true,
    metaTitle: "Lawn Care & Property Maintenance in Union City, NJ",
    intro: `Rootline Landscaping is based in Union City, NJ and proud to serve our local community with professional lawn care and property maintenance. Union City is one of the most densely populated cities in America, and we understand the unique challenges that come with maintaining properties here. Our team specializes in working with compact residential lots, multi-family properties, and the tight-access yards common throughout Union City. Whether you own a single-family home, manage rental properties, or need maintenance for a small commercial lot, we provide reliable lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service. We know Union City because we live and work here.`,
    whoWeServe: ["Homeowners", "Landlords", "Multi-family property owners", "Rental property managers", "Small commercial properties", "Small yards and compact lots"],
    nearby: ["west-new-york-nj", "north-bergen-nj", "weehawken-nj", "hoboken-nj", "jersey-city-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Union City, NJ?", a: "Yes, we are based in Union City and provide professional lawn mowing, trimming, edging, and blowing services for residential and small commercial properties." },
      { q: "Do you work with small yards in Union City?", a: "Absolutely. We specialize in the compact yards and tight-access properties common throughout Union City. No yard is too small for professional care." },
      { q: "Do you provide leaf cleanup in Union City?", a: "Yes, we offer complete fall leaf cleanup and removal services in Union City, including bed cleanup and debris disposal." },
      { q: "Do you serve rental properties in Union City?", a: "Yes, we work with many landlords and property managers in Union City who need reliable lawn care and property maintenance for their rental properties." },
      { q: "Do you offer snow removal in Union City?", a: "Yes, we provide snow removal services with winter storm availability for Union City properties including driveways, walkways, and small lots." },
    ],
  },
  "jersey-city-nj": {
    name: "Jersey City",
    state: "NJ",
    county: "Hudson County",
    fullName: "Jersey City, New Jersey",
    zip: "07302",
    coordinates: { lat: 40.7178, lng: -74.0431 },
    isPrimary: true,
    metaTitle: "Lawn Care & Property Maintenance in Jersey City, NJ",
    intro: `Rootline Landscaping serves Jersey City, NJ with professional lawn care and property maintenance designed for the diverse properties found throughout the city. From the brownstones and townhomes of the Heights to the residential neighborhoods of Greenville and Bergen-Lafayette, we understand Jersey City properties. Our services include lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service. We work with homeowners, landlords managing rental properties, multi-family property owners, and small commercial lots. Jersey City yards often require careful attention to backyard access, parking considerations, and efficient service - and that is exactly what we provide.`,
    whoWeServe: ["Homeowners", "Landlords", "Multi-family property owners", "Rental property managers", "Small commercial properties", "Backyard-only properties"],
    nearby: ["hoboken-nj", "union-city-nj", "north-bergen-nj", "bayonne-nj", "kearny-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Jersey City, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services throughout Jersey City including the Heights, Greenville, and Journal Square areas." },
      { q: "Do you service multi-family properties in Jersey City?", a: "Yes, we work with many multi-family property owners and landlords in Jersey City who need consistent, reliable lawn care and property maintenance." },
      { q: "Do you provide backyard cleanup in Jersey City?", a: "Yes, we service backyard-only properties and understand the access challenges common in Jersey City. We can work with limited access situations." },
      { q: "Do you offer recurring lawn service in Jersey City?", a: "Yes, we offer weekly and bi-weekly recurring lawn care service throughout Jersey City for consistent, reliable property maintenance." },
      { q: "Do you offer snow removal in Jersey City?", a: "Yes, we provide snow removal services with winter storm availability for Jersey City properties." },
    ],
  },
  "hoboken-nj": {
    name: "Hoboken",
    state: "NJ",
    county: "Hudson County",
    fullName: "Hoboken, New Jersey",
    zip: "07030",
    coordinates: { lat: 40.7440, lng: -74.0324 },
    isPrimary: true,
    metaTitle: "Lawn Care for Small Yards & Townhomes in Hoboken, NJ",
    intro: `Rootline Landscaping provides professional lawn care and property maintenance in Hoboken, NJ. Hoboken is known for its brownstones, townhomes, and compact residential properties with small yards and limited outdoor space. We specialize in exactly these types of properties. Our team provides lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service designed for Hoboken living. We understand the importance of clean curb appeal in a walkable city like Hoboken, and we work efficiently in tight-access areas common throughout town. Whether you have a small front yard, a backyard patio area, or a rooftop space that needs maintenance, we can help.`,
    whoWeServe: ["Homeowners", "Townhome owners", "Brownstone owners", "Landlords", "Rental properties", "Small yard specialists"],
    nearby: ["weehawken-nj", "jersey-city-nj", "union-city-nj", "north-bergen-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Hoboken, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services in Hoboken, including small yards and compact residential properties." },
      { q: "Do you work with small yards and townhomes in Hoboken?", a: "Absolutely. We specialize in the small yards, brownstone gardens, and compact outdoor spaces common throughout Hoboken." },
      { q: "Do you provide leaf cleanup in Hoboken?", a: "Yes, we offer complete fall leaf cleanup and removal services in Hoboken, including front yards, backyards, and tight-access areas." },
      { q: "Do you service rental properties in Hoboken?", a: "Yes, we work with landlords and property managers in Hoboken who need reliable lawn care and curb appeal maintenance for their rental properties." },
      { q: "Do you offer snow removal in Hoboken?", a: "Yes, we provide snow removal services with winter storm availability for Hoboken properties including sidewalks, stoops, and small lots." },
    ],
  },
  "north-bergen-nj": {
    name: "North Bergen",
    state: "NJ",
    county: "Hudson County",
    fullName: "North Bergen, New Jersey",
    zip: "07047",
    coordinates: { lat: 40.8040, lng: -74.0121 },
    isPrimary: true,
    metaTitle: "Lawn Care & Yard Maintenance in North Bergen, NJ",
    intro: `Rootline Landscaping serves North Bergen, NJ with professional lawn care and property maintenance services. North Bergen offers a mix of single-family homes, multi-family properties, and small commercial lots, and we service all of them. Our team provides lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service on a reliable schedule. Whether you live along Boulevard East with views of the Manhattan skyline or in the residential neighborhoods throughout the township, we provide consistent, professional lawn care. We work with homeowners, landlords, and property managers who value clean work and dependable service.`,
    whoWeServe: ["Homeowners", "Landlords", "Multi-family properties", "Rental property managers", "Small commercial properties"],
    nearby: ["union-city-nj", "west-new-york-nj", "weehawken-nj", "secaucus-nj", "fairview-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in North Bergen, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services throughout North Bergen Township." },
      { q: "Do you provide leaf cleanup in North Bergen?", a: "Yes, we offer complete fall leaf cleanup and removal services for North Bergen residential and commercial properties." },
      { q: "Do you offer weekly lawn care in North Bergen?", a: "Yes, we offer weekly and bi-weekly lawn care service with reliable scheduling throughout North Bergen." },
      { q: "Do you offer snow removal in North Bergen?", a: "Yes, we provide snow removal services with winter storm availability for North Bergen properties." },
    ],
  },
  "west-new-york-nj": {
    name: "West New York",
    state: "NJ",
    county: "Hudson County",
    fullName: "West New York, New Jersey",
    zip: "07093",
    coordinates: { lat: 40.7879, lng: -74.0143 },
    isPrimary: true,
    metaTitle: "Lawn Care for Small Yards in West New York, NJ",
    intro: `Rootline Landscaping provides lawn care and property maintenance services in West New York, NJ. As one of the most densely populated towns in New Jersey, West New York properties require a lawn care provider who understands compact spaces and efficient service. We specialize in the residential lots, multi-family properties, and small yards found throughout town. Our services include lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service. We provide reliable scheduling so you always know when to expect us, and we leave every property looking clean and professional.`,
    whoWeServe: ["Homeowners", "Landlords", "Multi-family properties", "Small yards", "Rental property managers"],
    nearby: ["union-city-nj", "north-bergen-nj", "weehawken-nj", "guttenberg-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in West New York, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services in West New York for residential and multi-family properties." },
      { q: "Do you work with small yards in West New York?", a: "Yes, we specialize in the compact yards and dense residential properties common throughout West New York." },
      { q: "Do you provide leaf cleanup in West New York?", a: "Yes, we offer fall leaf cleanup and removal services for West New York properties." },
      { q: "Do you offer snow removal in West New York?", a: "Yes, we provide snow removal services with winter storm availability for West New York properties." },
    ],
  },
  "weehawken-nj": {
    name: "Weehawken",
    state: "NJ",
    county: "Hudson County",
    fullName: "Weehawken, New Jersey",
    zip: "07086",
    coordinates: { lat: 40.7696, lng: -74.0205 },
    isPrimary: true,
    metaTitle: "Lawn Care for Small Yards in Weehawken, NJ",
    intro: `Rootline Landscaping serves Weehawken, NJ with professional lawn care and property maintenance designed for the compact residential properties and hillside homes that define this Hudson County community. Weehawken is known for its stunning Manhattan skyline views, well-maintained streets, and high property values - which means curb appeal matters here more than almost anywhere else in New Jersey.

Our team specializes in the smaller yards, tight-access areas, and sloped properties common throughout Weehawken. We provide lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service on a reliable schedule. Whether you own a townhome near the waterfront, a single-family home along Boulevard East, or a property in the hillside neighborhoods, we deliver clean, professional results every time.

Weehawken homeowners appreciate our attention to detail. We understand that exterior presentation is important in a community where neighbors take pride in their properties. Our crew arrives on schedule, completes the work efficiently, and leaves your property looking clean. We offer weekly and bi-weekly lawn care options so you can choose the frequency that works best for your lawn and budget.

For seasonal services, we provide thorough spring and fall cleanups to prepare your property for the changing seasons. Our fall leaf cleanup service keeps your lawn healthy and your property looking great through the autumn months. When winter arrives, we offer snow removal with storm availability to keep your walkways, steps, and driveway clear and safe.

If you live in Weehawken and want reliable lawn care from a local Hudson County company, contact Rootline Landscaping for a free estimate.`,
    whoWeServe: ["Homeowners", "Townhome owners", "Landlords", "Compact residential properties", "Hillside properties", "Waterfront area properties"],
    nearby: ["hoboken-nj", "union-city-nj", "west-new-york-nj", "north-bergen-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Weehawken, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services for Weehawken residential properties, including compact yards and hillside homes." },
      { q: "Do you work with small yards and tight-access properties in Weehawken?", a: "Absolutely. We specialize in the compact residential lots and tight-access areas common throughout Weehawken. Our equipment and crew are ready for smaller properties." },
      { q: "Do you provide seasonal cleanup in Weehawken?", a: "Yes, we offer spring and fall seasonal cleanup services to keep Weehawken properties looking their best year-round and maintain curb appeal." },
      { q: "Do you provide leaf cleanup in Weehawken?", a: "Yes, we offer complete fall leaf cleanup and removal services in Weehawken, including hillside properties where leaves tend to accumulate." },
      { q: "Do you offer snow removal in Weehawken?", a: "Yes, we provide snow removal services with winter storm availability for Weehawken properties including walkways, steps, and driveways." },
      { q: "Can I schedule weekly or bi-weekly lawn care in Weehawken?", a: "Yes, we offer flexible scheduling with weekly and bi-weekly lawn care options for Weehawken homeowners." },
    ],
  },
  "secaucus-nj": {
    name: "Secaucus",
    state: "NJ",
    county: "Hudson County",
    fullName: "Secaucus, New Jersey",
    zip: "07094",
    coordinates: { lat: 40.7895, lng: -74.0565 },
    isPrimary: true,
    metaTitle: "Lawn Care & Seasonal Cleanup in Secaucus, NJ",
    intro: `Rootline Landscaping provides lawn care and property maintenance services in Secaucus, NJ. Secaucus offers a unique mix of suburban-style residential neighborhoods and small commercial properties near the Meadowlands, and we serve both with professional, reliable service.

Our Secaucus clients include homeowners with larger residential lawns, landlords managing rental properties, and small commercial property owners who need consistent grounds maintenance. We provide lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service on a schedule that works for you - weekly, bi-weekly, or seasonal as needed.

The residential areas of Secaucus feature yards that benefit from regular maintenance. Our team keeps lawns looking healthy and well-groomed with consistent mowing at the right height, clean edging along driveways and walkways, and thorough debris cleanup after each visit. We show up when scheduled, complete the work professionally, and leave your property looking clean.

For seasonal services, we offer comprehensive spring and fall cleanups. In the fall, Secaucus properties accumulate significant leaves that need removal to protect lawn health and maintain appearance. Our leaf cleanup service handles the complete removal process, including beds, lawn areas, and disposal. In winter, we provide snow removal with storm availability to keep your property safe and accessible.

Secaucus property owners appreciate our straightforward approach: reliable scheduling, clean work, and fair pricing. If you need a dependable lawn care provider in Secaucus, contact Rootline Landscaping for a free estimate.`,
    whoWeServe: ["Homeowners", "Landlords", "Small commercial properties", "Townhome associations", "Property managers", "Rental property owners"],
    nearby: ["north-bergen-nj", "kearny-nj", "jersey-city-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Secaucus, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services for Secaucus residential and small commercial properties." },
      { q: "Do you provide recurring lawn care in Secaucus?", a: "Yes, we offer weekly and bi-weekly recurring lawn care service for Secaucus properties. Recurring service ensures your lawn stays well-maintained all season." },
      { q: "Do you provide leaf cleanup in Secaucus?", a: "Yes, we offer complete fall leaf cleanup and removal services throughout Secaucus, including lawn areas, beds, and debris disposal." },
      { q: "Can I request weekly or bi-weekly lawn care in Secaucus?", a: "Yes, we offer flexible scheduling including weekly and bi-weekly lawn care service for Secaucus properties based on your needs." },
      { q: "Do you offer snow removal in Secaucus?", a: "Yes, we provide snow removal services with winter storm availability for Secaucus residential and small commercial properties." },
      { q: "Do you service small commercial properties in Secaucus?", a: "Yes, we work with small commercial property owners in Secaucus who need reliable grounds maintenance and lawn care." },
    ],
  },
  "kearny-nj": {
    name: "Kearny",
    state: "NJ",
    county: "Hudson County",
    fullName: "Kearny, New Jersey",
    zip: "07032",
    coordinates: { lat: 40.7684, lng: -74.1454 },
    isPrimary: true,
    metaTitle: "Lawn Care & Yard Cleanup in Kearny, NJ",
    intro: `Rootline Landscaping serves Kearny, NJ with professional lawn care and property maintenance services. Kearny features established residential neighborhoods with traditional yards that need regular maintenance, and we provide exactly that - reliable, professional lawn care you can count on week after week.

Our services in Kearny include lawn mowing, trimming, edging, yard cleanup, seasonal cleanup, leaf removal, and snow service. We work with homeowners who want their property to look well-maintained, landlords who need consistent service for rental properties, and small commercial property owners who require professional grounds maintenance.

Kearny yards benefit from regular weekly or bi-weekly mowing during the growing season. Our team mows at the appropriate height for lawn health, trims around obstacles and fence lines, edges along driveways and walkways, and blows debris from hard surfaces. When we leave, your property looks clean and professionally maintained.

For seasonal services, we provide thorough spring cleanup to clear winter debris and prepare your lawn for the growing season. In fall, our leaf cleanup service removes accumulated leaves from lawn areas and beds before they damage your grass. During winter, we offer snow removal with storm availability to keep your driveway, walkways, and steps clear and safe.

Kearny property owners choose Rootline Landscaping because we show up when scheduled, do clean work, and charge fair prices. If you are looking for a lawn care provider who actually follows through, contact us for a free estimate.`,
    whoWeServe: ["Homeowners", "Landlords", "Rental property owners", "Small commercial properties", "Multi-family property owners"],
    nearby: ["secaucus-nj", "jersey-city-nj", "north-bergen-nj", "harrison-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Kearny, NJ?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services for Kearny residential properties." },
      { q: "Do you provide weekly lawn care in Kearny?", a: "Yes, we offer weekly and bi-weekly lawn care service for Kearny homeowners and landlords who want consistent, reliable maintenance." },
      { q: "Do you work with landlords and rental properties in Kearny?", a: "Yes, we serve many landlords in Kearny who need reliable lawn care for their rental properties. Consistent service helps maintain property value and tenant satisfaction." },
      { q: "Do you provide leaf cleanup in Kearny?", a: "Yes, we offer fall leaf cleanup and removal services for Kearny properties, including complete debris removal and disposal." },
      { q: "Do you offer snow removal in Kearny?", a: "Yes, we provide snow removal services with winter storm availability for Kearny properties." },
      { q: "Do you service small commercial properties in Kearny?", a: "Yes, we provide grounds maintenance and lawn care for small commercial properties in Kearny." },
    ],
  },
  "bayonne-nj": {
    name: "Bayonne",
    state: "NJ",
    county: "Hudson County",
    fullName: "Bayonne, New Jersey",
    zip: "07002",
    coordinates: { lat: 40.6687, lng: -74.1143 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care and property maintenance services in Bayonne, NJ. We serve Bayonne homeowners and landlords with professional lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service. Contact us to see if we can serve your Bayonne property.`,
    whoWeServe: ["Homeowners", "Landlords", "Rental properties"],
    nearby: ["jersey-city-nj", "kearny-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Bayonne, NJ?", a: "Yes, we provide lawn mowing services in select areas of Bayonne. Contact us for availability." },
      { q: "Do you provide leaf cleanup in Bayonne?", a: "Yes, we offer fall leaf cleanup services in Bayonne." },
    ],
  },
  // Bergen County - Active Service Area
  "bergen-county-nj": {
    name: "Bergen County",
    state: "NJ",
    county: "Bergen County",
    fullName: "Bergen County, New Jersey",
    zip: "07666",
    coordinates: { lat: 40.8876, lng: -74.0159 },
    isPrimary: true,
    intro: `Rootline Landscaping proudly serves Bergen County, NJ with professional lawn care and property maintenance services. Serving Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen, and surrounding North Jersey areas. We provide reliable lawn mowing, trimming, edging, seasonal cleanups, leaf removal, and snow service for Bergen County homeowners, landlords, and small commercial properties.`,
    whoWeServe: ["Homeowners", "Landlords", "Small commercial properties"],
    nearby: ["teaneck-nj", "garfield-nj", "fair-lawn-nj", "bergenfield-nj", "paramus-nj", "ridgewood-nj"],
    faqs: [
      { q: "Do you serve Bergen County, NJ?", a: "Yes. We serve Paramus, Ridgewood, Pascack Valley, Northern Valley, South Bergen, and surrounding North Jersey areas in Bergen County." },
      { q: "Do you offer lawn mowing in Bergen County?", a: "Yes, we provide professional lawn mowing, trimming, edging, and blowing services throughout Bergen County." },
    ],
  },
  "teaneck-nj": {
    name: "Teaneck",
    state: "NJ",
    county: "Bergen County",
    fullName: "Teaneck, New Jersey",
    zip: "07666",
    coordinates: { lat: 40.8976, lng: -74.0159 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Teaneck, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["bergenfield-nj", "englewood-nj", "garfield-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Teaneck, NJ?", a: "Yes, we provide lawn mowing services in Teaneck. Contact us for scheduling." },
    ],
  },
  "paramus-nj": {
    name: "Paramus",
    state: "NJ",
    county: "Bergen County",
    fullName: "Paramus, New Jersey",
    zip: "07652",
    coordinates: { lat: 40.9445, lng: -74.0754 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Paramus, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["fair-lawn-nj", "ridgewood-nj", "teaneck-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Paramus, NJ?", a: "Yes, we provide lawn mowing services in Paramus. Contact us for scheduling." },
    ],
  },
  "ridgewood-nj": {
    name: "Ridgewood",
    state: "NJ",
    county: "Bergen County",
    fullName: "Ridgewood, New Jersey",
    zip: "07450",
    coordinates: { lat: 40.9793, lng: -74.1166 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Ridgewood, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["paramus-nj", "fair-lawn-nj", "westwood-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Ridgewood, NJ?", a: "Yes, we provide lawn mowing services in Ridgewood. Contact us for scheduling." },
    ],
  },
  "englewood-nj": {
    name: "Englewood",
    state: "NJ",
    county: "Bergen County",
    fullName: "Englewood, New Jersey",
    zip: "07631",
    coordinates: { lat: 40.8929, lng: -73.9726 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Englewood, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["teaneck-nj", "tenafly-nj", "bergenfield-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Englewood, NJ?", a: "Yes, we provide lawn mowing services in Englewood. Contact us for scheduling." },
    ],
  },
  "fair-lawn-nj": {
    name: "Fair Lawn",
    state: "NJ",
    county: "Bergen County",
    fullName: "Fair Lawn, New Jersey",
    zip: "07410",
    coordinates: { lat: 40.9404, lng: -74.1318 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Fair Lawn, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["paramus-nj", "garfield-nj", "ridgewood-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Fair Lawn, NJ?", a: "Yes, we provide lawn mowing services in Fair Lawn. Contact us for scheduling." },
    ],
  },
  "garfield-nj": {
    name: "Garfield",
    state: "NJ",
    county: "Bergen County",
    fullName: "Garfield, New Jersey",
    zip: "07026",
    coordinates: { lat: 40.8815, lng: -74.1135 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Garfield, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["teaneck-nj", "fair-lawn-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Garfield, NJ?", a: "Yes, we provide lawn mowing services in Garfield. Contact us for scheduling." },
    ],
  },
  "bergenfield-nj": {
    name: "Bergenfield",
    state: "NJ",
    county: "Bergen County",
    fullName: "Bergenfield, New Jersey",
    zip: "07621",
    coordinates: { lat: 40.9276, lng: -73.9973 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Bergenfield, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["teaneck-nj", "englewood-nj", "tenafly-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Bergenfield, NJ?", a: "Yes, we provide lawn mowing services in Bergenfield. Contact us for scheduling." },
    ],
  },
  "tenafly-nj": {
    name: "Tenafly",
    state: "NJ",
    county: "Bergen County",
    fullName: "Tenafly, New Jersey",
    zip: "07670",
    coordinates: { lat: 40.9251, lng: -73.9526 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Tenafly, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["englewood-nj", "bergenfield-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Tenafly, NJ?", a: "Yes, we provide lawn mowing services in Tenafly. Contact us for scheduling." },
    ],
  },
  "westwood-nj": {
    name: "Westwood",
    state: "NJ",
    county: "Bergen County",
    fullName: "Westwood, New Jersey",
    zip: "07675",
    coordinates: { lat: 40.9912, lng: -74.0326 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Westwood, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["hillsdale-nj", "ridgewood-nj", "paramus-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Westwood, NJ?", a: "Yes, we provide lawn mowing services in Westwood. Contact us for scheduling." },
    ],
  },
  "hillsdale-nj": {
    name: "Hillsdale",
    state: "NJ",
    county: "Bergen County",
    fullName: "Hillsdale, New Jersey",
    zip: "07642",
    coordinates: { lat: 41.0065, lng: -74.0432 },
    isPrimary: false,
    intro: `Rootline Landscaping provides lawn care services in Hillsdale, NJ. Contact us for lawn mowing, seasonal cleanup, and property maintenance.`,
    whoWeServe: ["Homeowners", "Landlords"],
    nearby: ["westwood-nj", "ridgewood-nj"],
    faqs: [
      { q: "Do you offer lawn mowing in Hillsdale, NJ?", a: "Yes, we provide lawn mowing services in Hillsdale. Contact us for scheduling." },
    ],
  },
} as const

export type ServiceKey = keyof typeof services
export type LocationKey = keyof typeof locations

export const businessInfo = {
  name: "Rootline Landscaping",
  legalName: "Rootline Landscaping LLC",
  phone: "(551) 333-5296",
  phoneFormatted: "(551) 333-5296",
  phoneTel: "+15513335296",
  email: "info@rootlinenj.com",
  website: "https://www.rootlinenj.com",
  websiteDisplay: "rootlinenj.com",
  location: "Union City, NJ",
  county: "Bergen County, NJ",
  hours: "Reliable Scheduling",
  hoursDescription: "Weekly, bi-weekly, and seasonal service options available",
  mainCategory: "Lawn care service",
  officeNote: "Office by appointment only",
}

export const mainServices = [
  "Lawn mowing",
  "Trimming",
  "Edging",
  "Blowing",
  "Seasonal cleanup",
  "Leaf removal",
  "Snow removal",
  "Year-round property maintenance",
]

// Generate all valid service-location combinations
export function getAllServicePages() {
  const pages: { service: ServiceKey; location: LocationKey }[] = []
  
  for (const serviceKey of Object.keys(services) as ServiceKey[]) {
    for (const locationKey of Object.keys(locations) as LocationKey[]) {
      pages.push({ service: serviceKey, location: locationKey })
    }
  }
  
  return pages
}

// Get nearby locations for internal linking
export function getNearbyLocations(locationKey: LocationKey) {
  const location = locations[locationKey]
  if (!location || !location.nearby) return []

  const result: { slug: LocationKey; name: string }[] = []

  for (const slug of location.nearby) {
    if (!isLocationKey(slug)) continue
    result.push({ slug, name: locations[slug].name })
  }

  return result
}

export function isServiceKey(value: string): value is ServiceKey {
  return value in services
}

export function isLocationKey(value: string): value is LocationKey {
  return value in locations
}

export function getServiceLocationTitle(service: ServiceKey, location: LocationKey): string {
  return `${services[service].name} in ${locations[location].name}, NJ`
}
