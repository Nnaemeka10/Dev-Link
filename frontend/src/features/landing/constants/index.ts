import { apple, arrowDown, arrowUp, dribble, facebook, figma, freepik, google, profile, slack, uber, upwork } from "@assets/index"
import { BadgeCheck, BarChart2Icon, BriefcaseMedical, Brush, Code2, Database, Megaphone, Music, SearchIcon, UploadCloud, UserPlus2, VideoIcon } from "lucide-react"

export const NAV_LINKS = [
 {label: 'Home', href: '/',},
 {label: 'Find Job', href: '/jobs',},
 {label: 'Employers', href: '/employers',},
 {label: 'Candidates', href: '/candidates',},
 {label: 'Pricing Plans', href: '/pricing',},
 {label: 'Customer Supports', href: '/support',},
]


export const Languages  = [
  {
    
    "flag": "https://flagcdn.com/w40/gb.png",
    "language": "English"
  },

  {

    "flag": "https://flagcdn.com/w40/de.png",
    "language": "German"
  },
  {
  
    "flag": "https://flagcdn.com/w40/es.png",
    "language": "Spanish"
  },
  {
  
    "flag": "https://flagcdn.com/w40/fr.png",
    "language": "French"
  },
  
  {
    "flag": "https://flagcdn.com/w40/it.png",
    "language": "Italian"
  },
  {
    "flag": "https://flagcdn.com/w40/us.png",
    "language": "English US"
  }
]

export const COUNTRIES = [
  {
    "country": "Germany",
    "flag": "https://flagcdn.com/w40/de.png"
  },
  {
    "country": "Spain",
    "flag": "https://flagcdn.com/w40/es.png"
  },
  {
    "country": "France",
    "flag": "https://flagcdn.com/w40/fr.png"
  },
  {
    "country": "United Kingdom",
    "flag": "https://flagcdn.com/w40/gb.png"
  },
  {
    "country": "India",
    "flag": "https://flagcdn.com/w40/in.png"
  },
  {
    "country": "Italy",
    "flag": "https://flagcdn.com/w40/it.png"
  },
  {
    "country": "Nigeria",
    "flag": "https://flagcdn.com/w40/ng.png"
  },
  {
    "country": "United States",
    "flag": "https://flagcdn.com/w40/us.png"
  }
]

export const HOW_WE_WORK = [
  {
    title: "Create account",
    description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum, omnis",
    arrow: arrowUp,
    icon: UserPlus2,
  },

  {
    title: "Update resume",
    description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum, omnis",
    arrow: arrowDown,
    icon: UploadCloud,
  },
  
  {
    title: "Find suitable job",
    description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum, omnis",
    arrow: arrowUp,
    icon: SearchIcon,
  },

  {
    title: "Apply job",
    description: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nostrum, omnis",
    icon: BadgeCheck,
  },
]

export const POPULAR_VACANCIES = [
    {
      role: 'Anesthesiologists',
      number: '45,904'
    },
    {
      role: 'Maxillofacial Surgeons',
      number: '45,904'
    },
    {
      role: 'Financial Manager',
      number: '45,904'
    },
    {
      role: 'Surgeons',
      number: '45,904'
    },
    {
      role: 'Software Developer',
      number: '45,904'
    },
    {
      role: 'Management Analysis',
      number: '45,904'
    },
    {
      role: 'Obstetrician-Gynecologist',
      number: '45,904'
    },
    {
      role: 'Psychiatrist',
      number: '45,904'
    },
    {
      role: 'Orthodontists',
      number: '45,904'
    },
    {
      role: 'Data scientist',
      number: '45,904'
    },
    {
      role: 'Operations Research Analysis',
      number: '45,904'
    },
    {
      role: 'IT Manager',
      number: '45,904'
    }, 
  ]

  export const POPULAR_CATEGORIES = [
     {
      role: 'Graphics & Design',
      number: '45,904',
      icon: Brush,
    },
    {
      role: 'Music & Audio',
      number: '45,904',
      icon: Music,
    },
    {
      role: 'Code & Programming',
      number: '45,904',
      icon: Code2
    },
    {
      role: 'Account & Finance',
      number: '45,904',
      icon: BarChart2Icon,
    },
    {
      role: 'DIgital Marketing',
      number: '45,904',
      icon: Megaphone,
    },
    {
      role: 'Health & Care',
      number: '45,904',
      icon: BriefcaseMedical,
    },
    {
      role: 'Video and Animation',
      number: '45,904',
      icon: VideoIcon,
    },
    {
      role: 'Data science',
      number: '45,904',
      icon: Database
    },
  ]

  export const FEATURED_JOBS = [
    {
      role: "Senior UX Designer",
      tag: 'Contract Base',
      companyLogo: uber,
      location: 'Nigeria',
      minSalary: '30k',
      maxSalary: '35k',
    },
    {
      role: "Senior UX Designer",
      tag: 'Contract Base',
      companyLogo: apple,
      location: 'Kenya',
      minSalary: '30k',
      maxSalary: '35k',
    },
    {
      role: "Senior UX Designer",
      tag: 'Contract Base',
      companyLogo: upwork,
      location: 'Aba',
      minSalary: '30k',
      maxSalary: '35k',
    },
    {
      role: "Senior UX Designer",
      tag: 'Contract Base',
      companyLogo: facebook,
      location: 'Congo',
      minSalary: '30k',
      maxSalary: '35k',
    },
    {
      role: "Senior UX Designer",
      tag: 'Contract Base',
      companyLogo: google,
      location: 'Senegal',
      minSalary: '30k',
      maxSalary: '35k',
    },
    {
      role: "Senior UX Designer",
      tag: 'Contract Base',
      companyLogo: figma,
      location: 'Enugu',
      minSalary: '30k',
      maxSalary: '35k',
    },
  ] 

  export const TOP_COMPANIES = [
    {
      logo: dribble,
      companyName: 'Dribble',
      location: 'Ikwuano'
    },
    {
      logo: upwork,
      companyName: 'Upwork',
      location: 'Jos'
    },
    {
      logo: slack,
      companyName: 'Slack',
      location: 'Damaturu'
    },
    {
      logo: freepik,
      companyName: 'Freepik',
      location: 'Jalingo'
    },
    {
      logo: uber,
      companyName: 'Uber',
      location: 'Gusau'
    },
    {
      logo: figma,
      companyName: 'Figma',
      location: 'Dutse'
    },
    {
      logo: apple,
      companyName: 'Apple',
      location: 'Lafia'
    },
    {
      logo: facebook,
      companyName: 'Facebook',
      location: 'Minna'
    },
  ]

  export const TESTIMONIALS = [
    {
      rating: 5,
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore eum ea nemo.",
      profileimg: profile,
      name: 'Aliko dangote',
      role: 'Managing Director',
    },
    {
      rating: 5,
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quas deleniti iusto sint, totam praesentium nulla repellat!",
      profileimg: profile,
      name: 'John Ikechi',
      role: 'UI/UX Designer',
    },
    {
      rating: 5,
      description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempore eum ea nemo.",
      profileimg: profile,
      name: 'Mattmon Uche',
      role: 'Photographer',
    }
  ]