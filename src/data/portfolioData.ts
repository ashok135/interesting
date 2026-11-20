export interface ProjectItem {
  id: string;
  title: string;
  category: 'Reels' | 'Bollywood' | 'CGI & Gaming' | 'Commercials' | 'AI Generation';
  categoryLabel: string;
  youtubeId?: string;
  youtubeUrl?: string;
  year: string;
  description: string;
  tools: string[];
  featured?: boolean;
  role: string;
  stats?: string;
  coverImage?: string;
}

export interface ExperienceItem {
  period: string;
  role: string;
  company: string;
  type: string;
  location: string;
  description: string;
  highlights: string[];
  tools: string[];
}

export interface EducationItem {
  year: string;
  degree: string;
  institution: string;
  location: string;
  description?: string;
}

export interface SkillCategory {
  title: string;
  iconName: string;
  skills: { name: string; level: number; tags: string[] }[];
}

export const PORTFOLIO_DATA = {
  personal: {
    name: 'Sujan Kumar M.V',
    title: 'AI Animator • Video Editor • VFX Artist',
    shortBio:
      'Creative Mid-Level Video Editor & CGI Animator with 6+ years of production experience in Bollywood blockbusters, global television animation (Disney, Netflix), and cutting-edge AI generative video.',
    fullBio:
      'I specialize in visual storytelling, high-precision motion graphics, cinematic color grading, and seamless edits. Known for delivering high-quality visuals with creativity, precision, and relentless attention to detail across commercials, film trailers, and gaming reels.',
    location: 'Bangalore, Karnataka, India',
    email: 'sujankumar8147@gmail.com',
    phone: '+91 8147582669',
    phoneRaw: '+918147582669',
    whatsappUrl: 'https://wa.me/918147582669?text=Hi%20Sujan,%20I%20reviewed%20your%20portfolio%20and%20would%20love%20to%20discuss%20a%20video%20editing/animation%20project!',
    linkedinUrl: 'https://www.linkedin.com/in/sujan-kumar-b55950239',
    resumeUrl: '/Sujan_Kumar_MV_Resume.pdf',
    avatarUrl: '/images/sujan-profile.jpg',
    status: 'Available for Select Projects & Roles',
    languages: ['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil'],
    yearsExperience: '6+',
    bollywoodCount: '5+',
    globalShowsCount: '4+',
    projectsDelivered: '120+',
  },

  blockbusters: [
    {
      title: 'Brahmāstra (2022)',
      studio: 'Dharma / Star Studios',
      role: 'CGI & VFX Artist',
      tag: 'Bollywood Epic',
      badge: 'Box Office Hit',
    },
    {
      title: 'Kalki 2898 AD (2024)',
      studio: 'Vyjayanthi Movies',
      role: 'VFX & Sci-Fi Environment',
      tag: 'Sci-Fi Blockbuster',
      badge: 'Pan-India Epic',
    },
    {
      title: 'Fighter (2024)',
      studio: 'Marflix / Viacom18',
      role: 'Aerial Combat Visuals',
      tag: 'Action Thriller',
      badge: 'Theatrical Release',
    },
    {
      title: 'Munjya (2024)',
      studio: 'Maddock Films',
      role: 'CGI & Supernatural Effects',
      tag: 'Supernatural Horror',
      badge: 'Superhit',
    },
    {
      title: 'Sky Force (2025)',
      studio: 'Maddock Films',
      role: 'Action VFX Sequence Edit',
      tag: 'Aviation War Thriller',
      badge: 'Upcoming Feature',
    },
  ],

  cartoonShows: [
    {
      title: 'Mickey Mouse Funhouse',
      network: 'Disney Junior',
      role: '3D Character CGI Animator',
    },
    {
      title: 'Eureka!',
      network: 'Disney Junior',
      role: 'Prehistoric CG World Artist',
    },
    {
      title: "Butterbean's Café",
      network: 'Nickelodeon / Nick Jr.',
      role: '3D Culinary World Animator',
    },
    {
      title: 'Ridley Jones',
      network: 'Netflix Original',
      role: 'Museum Adventure Animation',
    },
  ],

  projects: [
    {
      id: 'gaming-demo-reel-2025',
      title: 'Gaming 3D Demo Reel 2025',
      category: 'CGI & Gaming',
      categoryLabel: 'Gaming & 3D Reel',
      youtubeId: 'MnftYQO8yHA',
      youtubeUrl: 'https://www.youtube.com/watch?v=MnftYQO8yHA',
      year: '2025',
      description:
        'Showcase of advanced 3D game animation, character rigging, dynamic combat motion, and cinematic camera choreography rendered in MAYA & game engines.',
      tools: ['Autodesk MAYA', 'After Effects', 'Premiere Pro', 'VFX Pipeline'],
      role: 'Lead Animator & Compositor',
      featured: true,
      stats: 'Full 3D Cinematic Sequence',
    },
    {
      id: 'movie-trailer-cut',
      title: 'High-Impact Movie Trailer Cut',
      category: 'Reels',
      categoryLabel: 'Trailer & Pacing',
      youtubeId: 'HVY9huLHs9I',
      youtubeUrl: 'https://www.youtube.com/watch?v=HVY9huLHs9I',
      year: '2024',
      description:
        'Fast-paced theatrical trailer cut focused on rhythm, sound sync, impactful tension-building transitions, and dramatic bass drops.',
      tools: ['Premiere Pro', 'After Effects', 'Sound Design', 'Color Grading'],
      role: 'Editor & Sound Designer',
      featured: true,
      stats: 'Theatrical Pace & Sound Sync',
    },
    {
      id: 'color-grading-showcase',
      title: 'Cinematic Color Grading Reel',
      category: 'Commercials',
      categoryLabel: 'Color Science',
      youtubeId: 'GfAGpq4RkXk',
      youtubeUrl: 'https://youtu.be/GfAGpq4RkXk',
      year: '2024',
      description:
        'Before/after color grading transformations matching Hollywood & high-end commercial palettes, skin tone preservation, and moody film-stock emulation.',
      tools: ['Lumetri Color', 'Premiere Pro', 'After Effects', 'LUT Creation'],
      role: 'Colorist & Finishing Artist',
      featured: true,
      stats: 'Before & After Grading Comparison',
    },
    {
      id: 'commercial-video-editing-reel',
      title: 'Commercial Video Editing Master Reel',
      category: 'Reels',
      categoryLabel: 'Master Reel',
      youtubeId: 'WwTgk8z5F5Y',
      youtubeUrl: 'https://youtu.be/WwTgk8z5F5Y',
      year: '2024',
      description:
        'Dynamic compilation of advertising cuts, music album syncs, cooking channel stories, fitness promos, and seamless motion graphics.',
      tools: ['Premiere Pro', 'After Effects', 'Photoshop', 'Audio Finishing'],
      role: 'Senior Video Editor',
      featured: true,
      stats: 'Multi-Genre Compilation',
    },
    {
      id: 'housing-ad-commercial',
      title: 'Luxury Real Estate Housing Commercial',
      category: 'Commercials',
      categoryLabel: 'Commercial Ad',
      youtubeId: '6yaMnkZ7_GI',
      youtubeUrl: 'https://youtu.be/6yaMnkZ7_GI',
      year: '2024',
      description:
        'High-end real estate advertisement cut with architectural typography, aerial stabilization, smooth parallax motion, and persuasive lifestyle narrative.',
      tools: ['Premiere Pro', 'After Effects', 'Kinetic Typography'],
      role: 'Director of Post-Production',
      featured: false,
      stats: 'Conversion-Focused Lifestyle Edit',
    },
    {
      id: '3d-character-action-reel',
      title: 'Character Animation & Dynamic Mechanics',
      category: 'CGI & Gaming',
      categoryLabel: 'Character Animation',
      youtubeId: '1n2YnsHoKy8',
      youtubeUrl: 'https://youtu.be/1n2YnsHoKy8',
      year: '2024',
      description:
        'In-depth breakdown of weight, anticipation, follow-through, and stylized character expression across animated series and gaming cinematics.',
      tools: ['Autodesk MAYA', 'Premiere Pro', 'CGI Pipeline'],
      role: 'Character Animator',
      featured: false,
      stats: 'Body Mechanics & Timing Study',
    },
  ] as ProjectItem[],

  experiences: [
    {
      period: 'Nov 2024 — Present',
      role: 'Lead Video Editor & AI Content Creator',
      company: 'Independent Creative Post-House',
      type: 'Freelance & Contract',
      location: 'Bangalore, India (Remote & On-Site)',
      description:
        'Directing end-to-end post-production for high-profile digital campaigns, commercial advertising, and music videos while integrating cutting-edge AI generation tools.',
      highlights: [
        'Created viral content formats across Astrology, Cooking, Fitness, Travel, and Tech channels.',
        'Cut cinematic theatrical teasers, marriage film documentaries, and music albums with rhythmic audio design.',
        'Pioneered AI-assisted image, voice, and video synthesis workflows saving 40% in visual production timelines.',
        'Designed high-conversion poster key arts and YouTube thumbnail packaging in Adobe Photoshop & Canva.',
      ],
      tools: ['Premiere Pro', 'After Effects', 'Photoshop', 'Midjourney', 'ElevenLabs', 'Runway', 'Canva'],
    },
    {
      period: 'Feb 2019 — Nov 2024',
      role: 'Senior CG, VFX & Game Animator',
      company: 'Premier Animation & Film Studios',
      type: 'Full-Time & Freelance',
      location: 'Bangalore & Mumbai Pipelines',
      description:
        'Executed 3D animation, VFX sequences, and character staging for major Bollywood theatrical features and international children television shows.',
      highlights: [
        'Contributed to Bollywood blockbuster visual effects for Brahmāstra (2022), Kalki 2898 AD (2024), Fighter (2024), and Munjya (2024).',
        'Animated 3D character performances for Disney Junior shows including Mickey Mouse Funhouse and Eureka!.',
        'Delivered broadcast-standard animation for Nickelodeon Butterbean’s Café and Netflix original Ridley Jones.',
        'Maintained strict studio pipeline compliance across Maya character rigs, camera passes, and composite handoffs.',
      ],
      tools: ['Autodesk MAYA', 'After Effects', 'Premiere Pro', 'VFX Compositing', 'Asset Rigging'],
    },
    {
      period: '2012 — 2013',
      role: 'CAD Draftsman & Educational Author',
      company: 'BEL PU College',
      type: 'Technical Staff',
      location: 'Bangalore, India',
      description:
        'Drafted precision engineering schematics and co-authored curriculum textbook for technical students in Karnataka state.',
      highlights: [
        'Authored and published a state-recognized textbook on Electrical & Electronics (E&E) for 11th standard students.',
        'Engineered 2D/3D drafting schematics with micrometric accuracy in CAD environments.',
        'Mentored students in technical illustration and engineering drawing fundamentals.',
      ],
      tools: ['AutoCAD', 'Technical Drafting', 'Curriculum Design'],
    },
  ] as ExperienceItem[],

  education: [
    {
      year: '2018',
      degree: 'CG, VFX Animation & Video Editing Professional Diploma',
      institution: 'Arena Animations',
      location: 'Bangalore, Karnataka',
      description:
        'Comprehensive specialization in Maya 3D workflows, After Effects visual effects, Premiere Pro nonlinear editing, and cinematic lighting.',
    },
    {
      year: '2008 — 2011',
      degree: 'Diploma in Electrical & Electronics Engineering (EEE)',
      institution: 'Acharya Institute of Technology',
      location: 'Bangalore, Karnataka',
      description:
        'Solid foundational engineering discipline, problem-solving methodologies, and technical schematic systems thinking.',
    },
  ] as EducationItem[],

  skillCategories: [
    {
      title: 'Video Editing & Post-Production',
      iconName: 'Film',
      skills: [
        { name: 'Adobe Premiere Pro', level: 95, tags: ['NLE', 'Pacing', 'Multicam', 'Audio'] },
        { name: 'Pacing & Narrative Cuts', level: 92, tags: ['Storytelling', 'Rhythm', 'Retention'] },
        { name: 'Commercial & Ad Formats', level: 90, tags: ['Reels', 'Shorts', '16:9 & 9:16'] },
        { name: 'Movie Trailer Cuts', level: 88, tags: ['Theatrical', 'Tension', 'Impact'] },
      ],
    },
    {
      title: 'Visual Effects & Motion Graphics',
      iconName: 'Sparkles',
      skills: [
        { name: 'Adobe After Effects', level: 90, tags: ['Compositing', 'Tracking', 'VFX'] },
        { name: 'Motion Graphics & Titles', level: 88, tags: ['Kinetic Type', 'Lower Thirds'] },
        { name: 'Green Screen & Rotoscopy', level: 86, tags: ['Keying', 'Clean Plates'] },
        { name: 'Sound Design & Audio Sync', level: 85, tags: ['SFX', 'Bass Drops', 'Foley'] },
      ],
    },
    {
      title: '3D CGI & Character Animation',
      iconName: 'Box',
      skills: [
        { name: 'Autodesk MAYA', level: 85, tags: ['3D Modeling', 'Rigging', 'Animation'] },
        { name: 'Character Body Mechanics', level: 84, tags: ['Weight', 'Timing', 'Expressions'] },
        { name: 'Game Cinematic Animation', level: 82, tags: ['Combat', 'Cinematics'] },
        { name: 'Lighting & Scene Staging', level: 80, tags: ['Cameras', 'Passes'] },
      ],
    },
    {
      title: 'AI Generative Technologies',
      iconName: 'Cpu',
      skills: [
        { name: 'AI Video Generation', level: 90, tags: ['Runway Gen-3', 'Luma Dream', 'Pika'] },
        { name: 'AI Image Synthesis', level: 92, tags: ['Midjourney', 'Stable Diffusion'] },
        { name: 'AI Voice Cloning & Audio', level: 88, tags: ['ElevenLabs', 'Dubbing'] },
        { name: 'Hybrid AI-Human Pipeline', level: 94, tags: ['Speed', 'Consistency'] },
      ],
    },
    {
      title: 'Graphic Design & Finishing',
      iconName: 'Palette',
      skills: [
        { name: 'Adobe Photoshop', level: 90, tags: ['Key Art', 'Posters', 'Thumbnails'] },
        { name: 'Cinematic Color Grading', level: 88, tags: ['Lumetri', 'LUTs', 'Skin Tones'] },
        { name: 'Canva Pro Publishing', level: 92, tags: ['Social Collateral', 'Layouts'] },
        { name: 'Poster & Key Art Design', level: 86, tags: ['Visual Hierarchy', 'Type'] },
      ],
    },
  ],
};
