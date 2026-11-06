export const profile = {
  name: 'Joaquín Pettinari',
  role: 'Full-Stack Developer',
  location: 'Milan, Italy',
  intro:
    'I build web applications with React, TypeScript and Node.js. My experience spans financial products, 3D human motion visualization and healthcare portals.',
  email: 'joaquinpettinari@hotmail.com',
  linkedin: 'https://www.linkedin.com/in/joaquin-pettinari/',
  github: 'https://github.com/JoaquinPettinari',
  skills: [
    'React',
    'TypeScript',
    'JavaScript',
    'Three.js',
    'Redux',
    'Astro',
    'Tailwind CSS',
    'Material UI',
    'Node.js',
    'Express',
    'Java',
    'Spring Boot',
    'MongoDB',
    'PostgreSQL',
    'Docker',
    'Git',
  ],
  languages:
    'Native Spanish · Advanced English · Certified B1 Italian · Beginner Norwegian',
}

export const experience = [
  {
    company: 'Blue Alba',
    role: 'Full-Stack Developer',
    dates: '03/2024 — Present',
    location: 'Remote',
    description:
      'Developing financial applications with React, Node.js and Java. Building REST APIs and interfaces backed by PostgreSQL, with Docker containers and Rancher deployments.',
  },
  {
    company: 'Bright Mediums',
    role: 'Frontend Developer · React / Three.js',
    dates: '02/2022 — 03/2024',
    location: 'United States · Remote',
    description:
      'Built a 3D athlete motion visualization application from scratch. Created visualizations of biomechanical data, joint angles and metrics for analysis by medical specialists.',
  },
  {
    company: 'Swiss Medical Group',
    role: 'Frontend Developer · React',
    dates: '10/2020 — 05/2022',
    location: 'Buenos Aires, Argentina',
    description:
      'Maintained the public website and developed customer portal modules for appointments, reimbursements, provider directories and digital membership cards.',
  },
  {
    company: 'Hurlingham National University',
    role: 'Teaching Assistant',
    dates: '03/2019 — 03/2022',
    location: 'Buenos Aires, Argentina',
    description: 'Taught Object-Oriented Programming I.',
  },
]

export const education = [
  {
    title: 'Master’s Degree in Web Application Development',
    institution: 'European University',
    dates: '10/2025 — 10/2026',
  },
  {
    title: 'Degree in Computer Science',
    institution: 'Hurlingham National University',
    dates: '07/2018 — 07/2024',
  },
  {
    title: 'Advanced React',
    institution: 'Meta · Coursera',
    dates: 'Certification',
  },
]

export const projects = [
  {
    id: 'routewise',
    title: 'RouteWise',
    category: 'Master’s final project · 2026',
    summary:
      'Multi-destination travel planning through graph-based searches of airline connections.',
    problem:
      'Build an itinerary when the origin, destination and some preferences are known, but the intermediate cities are still open.',
    contribution:
      'Individually developed the frontend, API, data model and route generation algorithm. Integrated constrained searches, itinerary details, travel guides and temporary sharing links.',
    result:
      'A working prototype that proposes and compares routes, grouping alternatives by an indicative budget. MongoDB stores persistent data, while Redis manages expiring shared routes.',
    scope:
      'Academic project: simulated prices and schedules, with no booking or guarantee of real availability. The report documents manual functional validation; automated tests remain future work.',
    stack: [
      'React',
      'TypeScript',
      'Node.js',
      'Express',
      'MongoDB',
      'Redis',
      'Docker',
      'Graphs',
    ],
    links: [
      {
        label: 'Frontend source code',
        url: 'https://github.com/JoaquinPettinariUEM/TFM-Airports-Front',
      },
      {
        label: 'Backend source code',
        url: 'https://github.com/JoaquinPettinariUEM/TFM-Airports',
      },
    ],
  },
  {
    id: 'accesiweb',
    title: 'AccesiWeb',
    category: 'Undergraduate thesis · 2024',
    summary:
      'A tool for detecting web accessibility issues and organizing findings by evaluation criteria.',
    problem:
      'Make website accessibility barriers easier to identify, using WCAG 2.0 and the Argentine framework studied in the thesis as references.',
    contribution:
      'Developed the React interface and analysis service with Node.js, Express and Pa11y. Presented errors, warnings and notices, tested user flows with Cypress and evaluated websites.',
    result:
      'A tool that analyzes a URL and presents grouped findings. The thesis includes end-to-end tests and evaluations of university websites.',
    scope:
      'Automated evaluation supports accessibility reviews; it does not certify comprehensive compliance. The scope reflects the academic work completed in July 2024.',
    stack: ['React', 'Node.js', 'Express', 'Pa11y', 'Cypress', 'Accessibility'],
    links: [],
  },
]
