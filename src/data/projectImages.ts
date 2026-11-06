type ProjectImage = {
  src: string
  alt: string
  caption: string
  width: number
  height: number
}

export const projectImages: Record<string, ProjectImage[]> = {
  routewise: [
    {
      src: '/images/projects/routewise-home.webp',
      alt: 'RouteWise landing page with a coastal destination',
      caption: 'Trip planning landing page.',
      width: 1440,
      height: 687,
    },
    {
      src: '/images/projects/routewise-itinerary.webp',
      alt: 'RouteWise itinerary showing stops and route details',
      caption: 'Generated itinerary and route details.',
      width: 1440,
      height: 1081,
    },
  ],
  accesiweb: [
    {
      src: '/images/projects/accesiweb-analysis.webp',
      alt: 'AccesiWeb URL analysis with errors, warnings and notices',
      caption: 'Analysis overview. Original interface in Spanish.',
      width: 752,
      height: 591,
    },
    {
      src: '/images/projects/accesiweb-results.webp',
      alt: 'AccesiWeb accessibility findings grouped by severity',
      caption:
        'Detailed accessibility findings. Original interface in Spanish.',
      width: 721,
      height: 636,
    },
  ],
}
