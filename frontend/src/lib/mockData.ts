import type { IEvent } from "./models/Event";

export const MOCK_EVENTS: IEvent[] = [
  {
    _id: "1",
    title: "Next.js Conference 2026",
    description:
      "A full-day conference covering the latest in Next.js, React Server Components, and modern web development.",
    date: "2026-04-15",
    location: "Stockholm, Sweden",
    capacity: 200,
    ticketUrl: "https://tickets.example.com/nextjs-conference-2026",
    budget: 5000,
    currency: "SEK",
    budgetItems: [
      { id: "1-1", category: "Venue", description: "Convention center rental", amount: 2000 },
      { id: "1-2", category: "Catering", description: "Lunch & coffee breaks", amount: 1200 },
      { id: "1-3", category: "Marketing", description: "Social media ads & print", amount: 400 },
      { id: "1-4", category: "Equipment", description: "AV & streaming equipment", amount: 200 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: "2",
    title: "TypeScript Workshop",
    description:
      "Hands-on workshop for intermediate developers looking to level up their TypeScript skills.",
    date: "2026-05-02",
    location: "Gothenburg, Sweden",
    capacity: 30,
    ticketUrl: "https://tickets.example.com/typescript-workshop",
    budget: 1500,
    currency: "SEK",
    budgetItems: [
      { id: "2-1", category: "Venue", description: "Training room hire", amount: 600 },
      { id: "2-2", category: "Catering", description: "Fika & lunch", amount: 350 },
      { id: "2-3", category: "Equipment", description: "Laptop rental x5", amount: 250 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: "3",
    title: "Cloud Database Meetup",
    description:
      "Learn best practices for running production-ready database backends with Node.js and Next.js apps.",
    date: "2026-05-20",
    location: "Online",
    capacity: 500,
    ticketUrl: "https://tickets.example.com/cloud-database-meetup",
    budget: 800,
    currency: "USD",
    budgetItems: [
      { id: "3-1", category: "Marketing", description: "Event promotion ads", amount: 300 },
      { id: "3-2", category: "Equipment", description: "Streaming & recording tools", amount: 120 }
    ],
    createdAt: new Date().toISOString()
  }
];
