"use client";

import { useEffect, useState } from "react";
import { JobRequest, JobFeedFilters } from "@/types/job";
import { VisitOffer, CounterHistoryItem } from "@/types/offer";
import { InspectionReport } from "@/types/inspection";
import { getSocket } from "@/lib/socket";

const INITIAL_JOBS: JobRequest[] = [
  {
    id: "job-101",
    title: "Instant Geyser Pilot Burner Not Igniting & Gas Odor",
    category: "Plumber",
    urgency: "emergency",
    problemSummary: "Gas water heater pilot flame keeps blowing out with mild gas smell in laundry area.",
    description:
      "Our Fischer instant gas geyser's pilot burner does not catch flame even after multiple ignition attempts. When forced, there is a mild gas odor. Need an experienced technician with gas leakage detection tools to safely inspect and repair before evening.",
    location: {
      area: "Hayatabad Phase 3, Peshawar",
      city: "Peshawar",
      distanceKm: 1.8,
      fullAddress: "House 42, Street 7, Sector F-2, Hayatabad Phase 3, Peshawar",
      coordinates: { lat: 33.987, lng: 71.432 },
    },
    postedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    postedAgo: "12 mins ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "11:30 AM - 01:00 PM",
    },
    customerSuggestedPrice: 500,
    photos: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80",
    ],
    voiceNote: {
      url: "https://actions.google.com/sounds/v1/ambiences/humming_fridge.ogg",
      durationSeconds: 18,
      waveform: [30, 45, 75, 90, 60, 40, 80, 100, 85, 50, 65, 40, 30, 70, 95, 80, 50, 20],
    },
    customer: {
      id: "cust-1",
      name: "Mrs. Arifa Khan",
      phone: "+92 300 9876543",
      rating: 4.9,
      totalReviews: 28,
      area: "Hayatabad Phase 3",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 0,
    status: "open",
  },
  {
    id: "job-102",
    title: "Concealed Toilet Flush Tank Leakage & Float Valve Jam",
    category: "Plumber",
    urgency: "standard",
    problemSummary: "In-wall Grohe toilet cistern is continuously overflowing into bowl.",
    description:
      "Water is running non-stop into the toilet commode from the concealed wall fixture. The float shut-off mechanism appears calcified or dislodged. Requires careful removal of the actuator faceplate without cracking tiles.",
    location: {
      area: "University Town, Circular Rd",
      city: "Peshawar",
      distanceKm: 3.2,
      fullAddress: "Bungalow 18-A, Old Jamrud Rd, University Town, Peshawar",
      coordinates: { lat: 34.004, lng: 71.488 },
    },
    postedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    postedAgo: "35 mins ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "02:00 PM - 04:00 PM",
    },
    customerSuggestedPrice: 600,
    photos: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-2",
      name: "Dr. Farooq Shah",
      phone: "+92 312 8765432",
      rating: 4.8,
      totalReviews: 15,
      area: "University Town",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "open",
  },
  {
    id: "job-103",
    title: "Main Distribution Board Tripping & Burnt Circuit Breaker",
    category: "Electrician",
    urgency: "emergency",
    problemSummary: "63A main double-pole breaker overheating and tripping ground floor lights.",
    description:
      "The main breaker panel emitted sparks and burning plastic smell. Half the house has lost electricity. Need immediate visit to check load balancing, replace faulty breaker, and inspect wiring joints.",
    location: {
      area: "Gulberg III, Sector B",
      city: "Peshawar",
      distanceKm: 2.1,
      fullAddress: "Flat 402, Al-Razi Heights, Gulberg III, Peshawar",
      coordinates: { lat: 34.015, lng: 71.535 },
    },
    postedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    postedAgo: "45 mins ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "Scheduled Arrival: 11:30 AM",
    },
    customerSuggestedPrice: 800,
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    securityPin: "7294",
    etaMinutes: 12,
    photos: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    ],
    voiceNote: {
      url: "https://actions.google.com/sounds/v1/ambiences/humming_fridge.ogg",
      durationSeconds: 24,
      waveform: [40, 60, 90, 80, 50, 70, 100, 95, 60, 45, 80, 75, 40, 25],
    },
    customer: {
      id: "cust-3",
      name: "Ahmed Khan",
      phone: "+92 333 1234567",
      rating: 5.0,
      totalReviews: 42,
      area: "Gulberg III",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "accepted", // Upcoming visit
  },
  {
    id: "job-104",
    title: "1.5 Ton Inverter AC Gas Leakage & Cooling Coil Inspection",
    category: "AC Technician",
    urgency: "standard",
    problemSummary: "Gree inverter AC blowing warm air, error code E6 on display.",
    description:
      "The outdoor unit runs for 3 minutes and then shuts off. Unit was serviced 2 months ago. Suspecting refrigerant leak at flared copper joints. Bring nitrogen pressure gauge and R410A gas kit.",
    location: {
      area: "Saddar Cantonment, Peshawar",
      city: "Peshawar",
      distanceKm: 4.5,
      fullAddress: "House 12-B, The Mall Road, Saddar Peshawar Cantt",
      coordinates: { lat: 34.008, lng: 71.551 },
    },
    postedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    postedAgo: "1 hour ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "02:30 PM - 04:00 PM",
    },
    customerSuggestedPrice: 1000,
    visitCharge: 1000,
    platformCommission: 100,
    workerNetEarnings: 900,
    securityPin: "4819",
    photos: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-4",
      name: "Sardar Bilal",
      phone: "+92 345 5544332",
      rating: 4.7,
      totalReviews: 19,
      area: "Saddar Cantt",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 3,
    status: "accepted", // Upcoming visit 1
  },
  {
    id: "job-105",
    title: "Kitchen Cabinet Hydraulic Hinges & Sliding Track Repair",
    category: "Carpenter",
    urgency: "standard",
    problemSummary: "Two soft-close cabinet doors fallen off hinges, drawer track seized.",
    description:
      "Wood screws in the particle board frame came loose. Need reinforced hardwood inserts or new heavy-duty clip-on hinges installed. Also one pantry drawer slider ball-bearing is stuck.",
    location: {
      area: "Warsak Road Officers Colony",
      city: "Peshawar",
      distanceKm: 5.6,
      fullAddress: "Street 4, Sector C, Officers Colony, Warsak Road, Peshawar",
      coordinates: { lat: 34.041, lng: 71.521 },
    },
    postedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    postedAgo: "2 hours ago",
    preferredVisitWindow: {
      date: "Tomorrow, 25 Oct",
      timeSlot: "10:00 AM - 12:00 PM",
    },
    customerSuggestedPrice: 600,
    visitCharge: 600,
    platformCommission: 60,
    workerNetEarnings: 540,
    securityPin: "8312",
    photos: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-5",
      name: "Tariq Javed",
      phone: "+92 301 7766554",
      rating: 4.9,
      totalReviews: 31,
      area: "Warsak Road",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "accepted", // Upcoming visit 2
  },
  {
    id: "job-110",
    title: "Homage 2.4kVA Inverter UPS Wiring & Battery Terminal Replacement",
    category: "Electrician",
    urgency: "emergency",
    problemSummary: "UPS inverter sparking at battery positive terminal with acid corrosion.",
    description:
      "Heavy duty brass terminal clamps corroded. Inverter cuts off to overload when AC power drops. Need cleaning with baking soda solution, heavy gauge copper lugs crimped, and load test on 4 fans + 6 LED lights.",
    location: {
      area: "University Town, Park Road",
      city: "Peshawar",
      distanceKm: 2.9,
      fullAddress: "House 34, Park Road, University Town, Peshawar",
      coordinates: { lat: 34.003, lng: 71.493 },
    },
    postedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    postedAgo: "2 hours ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "04:30 PM - 06:00 PM",
    },
    customerSuggestedPrice: 800,
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    securityPin: "9145",
    photos: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-10",
      name: "Prof. Asadullah",
      phone: "+92 333 9128374",
      rating: 5.0,
      totalReviews: 14,
      area: "University Town",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "accepted", // Upcoming visit 3
  },
  {
    id: "job-111",
    title: "Underground Water Tank Submersible Pump Tripping Circuit",
    category: "Plumber",
    urgency: "emergency",
    problemSummary: "1.5HP Italian submerged pump tripping breaker after 30 seconds of running.",
    description:
      "Water is not pumping to rooftop overhead tank. Suspecting motor capacitor failure or sand blockage in suction impeller. Need water line pressure test and capacitor replacement.",
    location: {
      area: "Hayatabad Phase 5, Sector B-2",
      city: "Peshawar",
      distanceKm: 3.8,
      fullAddress: "Bungalow 77, Street 11, Sector B-2, Hayatabad Phase 5, Peshawar",
      coordinates: { lat: 33.982, lng: 71.425 },
    },
    postedAt: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    postedAgo: "3 hours ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "06:00 PM - 07:30 PM",
    },
    customerSuggestedPrice: 900,
    visitCharge: 900,
    platformCommission: 90,
    workerNetEarnings: 810,
    securityPin: "3671",
    photos: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-11",
      name: "Haji Munir Khan",
      phone: "+92 300 7861122",
      rating: 4.8,
      totalReviews: 22,
      area: "Hayatabad Phase 5",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "accepted", // Upcoming visit 4
  },
  {
    id: "job-112",
    title: "Master Bedroom Split AC Blower Fan Noise & Filter Deep Clean",
    category: "AC Technician",
    urgency: "standard",
    problemSummary: "Dawlance 1.5 ton indoor unit vibrating heavily on medium & high speed.",
    description:
      "Blower cylinder wheel is unbalanced or bushings worn out. Requires disassembling front plastic casing, jet wash chemical foam cleaning of cooling coil, and dynamic wheel balancing.",
    location: {
      area: "Gulberg III, Sector C",
      city: "Peshawar",
      distanceKm: 2.3,
      fullAddress: "House 19, Street 3, Sector C, Gulberg III, Peshawar",
      coordinates: { lat: 34.013, lng: 71.532 },
    },
    postedAt: new Date(Date.now() - 190 * 60 * 1000).toISOString(),
    postedAgo: "3 hours ago",
    preferredVisitWindow: {
      date: "Tomorrow, 25 Oct",
      timeSlot: "11:30 AM - 01:00 PM",
    },
    customerSuggestedPrice: 1200,
    visitCharge: 1200,
    platformCommission: 120,
    workerNetEarnings: 1080,
    securityPin: "5209",
    photos: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-12",
      name: "Dr. Nadia Shah",
      phone: "+92 315 4499881",
      rating: 4.9,
      totalReviews: 17,
      area: "Gulberg III",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 3,
    status: "accepted", // Upcoming visit 5
  },
  {
    id: "job-113",
    title: "Smart Wi-Fi Geyser Timer Switch & Circuit Protection Box",
    category: "Electrician",
    urgency: "standard",
    problemSummary: "Install Sonoff 30A smart timer switch for gas/electric hybrid water heater.",
    description:
      "Need professional neat installation with magnetic contactor inside weatherproof breaker box. Wire correctly from main distribution board with 4mm Pakistan Cables wire.",
    location: {
      area: "DHA Phase 1, Sector B",
      city: "Peshawar",
      distanceKm: 7.1,
      fullAddress: "Villa 104, Street 8, Sector B, DHA Peshawar",
      coordinates: { lat: 33.974, lng: 71.415 },
    },
    postedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    postedAgo: "3 hours ago",
    preferredVisitWindow: {
      date: "Tomorrow, 25 Oct",
      timeSlot: "02:00 PM - 03:30 PM",
    },
    customerSuggestedPrice: 1000,
    visitCharge: 1000,
    platformCommission: 100,
    workerNetEarnings: 900,
    securityPin: "7741",
    photos: [
      "https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-13",
      name: "Major (R) Salman",
      phone: "+92 331 6655443",
      rating: 5.0,
      totalReviews: 39,
      area: "DHA Phase 1",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "accepted", // Upcoming visit 6
  },
  {
    id: "job-114",
    title: "Kitchen Sink Drain Trap Blockage & Single-Lever Mixer Tap Replacement",
    category: "Plumber",
    urgency: "standard",
    problemSummary: "Double-bowl stainless sink draining very slow with foul smell in cabinet.",
    description:
      "P-trap is choked with grease and debris. Also purchased new brass chrome goose-neck mixer tap that needs installation without damaging the granite counter cutout.",
    location: {
      area: "City Circular Road, Peshawar",
      city: "Peshawar",
      distanceKm: 4.2,
      fullAddress: "Shop 14-B, Upper Floor Flat, City Circular Road, Peshawar",
      coordinates: { lat: 34.018, lng: 71.568 },
    },
    postedAt: new Date(Date.now() - 250 * 60 * 1000).toISOString(),
    postedAgo: "4 hours ago",
    preferredVisitWindow: {
      date: "Tomorrow, 25 Oct",
      timeSlot: "04:30 PM - 06:00 PM",
    },
    customerSuggestedPrice: 700,
    visitCharge: 700,
    platformCommission: 70,
    workerNetEarnings: 630,
    securityPin: "6192",
    photos: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-14",
      name: "Kashif Afridi",
      phone: "+92 322 8899001",
      rating: 4.8,
      totalReviews: 20,
      area: "City Circular Rd",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "accepted", // Upcoming visit 7
  },
  {
    id: "job-115",
    title: "5kVA Generator Automatic Transfer Switch (ATS) Wiring & Relay Tuning",
    category: "Mechanic",
    urgency: "standard",
    problemSummary: "ATS panel not triggering generator self-start during WAPDA load shedding.",
    description:
      "12V battery charging relay in ATS panel failed. Generator cranks manually fine. Need inspection of ATS control board, timer delay relay adjustment, and contractor contact cleanup.",
    location: {
      area: "Kohat Road Industrial Area",
      city: "Peshawar",
      distanceKm: 8.2,
      fullAddress: "Plot 45, Small Industries Estate, Kohat Road, Peshawar",
      coordinates: { lat: 33.958, lng: 71.524 },
    },
    postedAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    postedAgo: "5 hours ago",
    preferredVisitWindow: {
      date: "Saturday, 26 Oct",
      timeSlot: "10:00 AM - 12:00 PM",
    },
    customerSuggestedPrice: 1500,
    visitCharge: 1500,
    platformCommission: 150,
    workerNetEarnings: 1350,
    securityPin: "2840",
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-15",
      name: "Engr. Zahir Shah",
      phone: "+92 344 1122334",
      rating: 4.9,
      totalReviews: 45,
      area: "Kohat Road",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "accepted", // Upcoming visit 8
  },
  {
    id: "job-116",
    title: "Main Solid Teak Entrance Door Lock & Heavy-Duty Deadbolt Fitting",
    category: "Carpenter",
    urgency: "standard",
    problemSummary: "Old cylindrical lock broken, need mortise sash lock & security deadbolt mortised.",
    description:
      "Solid Sheesham/Teakwood main double door requires neat chisel work for Italian Iseo mortise lock body, brass handle plate, and 3-pin deadbolt cylinder.",
    location: {
      area: "Hayatabad Phase 2, Sector J",
      city: "Peshawar",
      distanceKm: 2.6,
      fullAddress: "House 204, Street 9, Sector J, Hayatabad Phase 2, Peshawar",
      coordinates: { lat: 33.992, lng: 71.442 },
    },
    postedAt: new Date(Date.now() - 340 * 60 * 1000).toISOString(),
    postedAgo: "5 hours ago",
    preferredVisitWindow: {
      date: "Saturday, 26 Oct",
      timeSlot: "02:30 PM - 04:30 PM",
    },
    customerSuggestedPrice: 1000,
    visitCharge: 1000,
    platformCommission: 100,
    workerNetEarnings: 900,
    securityPin: "9043",
    photos: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-16",
      name: "Barrister Fawad Khan",
      phone: "+92 300 3344556",
      rating: 5.0,
      totalReviews: 28,
      area: "Hayatabad Phase 2",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "accepted", // Upcoming visit 9
  },
  {
    id: "job-117",
    title: "Drawing Room Feature Wall Velvet Texture & Damp Protection Primer",
    category: "Painter",
    urgency: "flexible",
    problemSummary: "16x10 ft feature wall requires metallic stucco / velvet effect finish.",
    description:
      "Wall has minor efflorescence moisture from adjoining bath. Scrape surface, apply salt-damp seal chemical primer coat, followed by Diamond velvet texture with metallic trowel styling.",
    location: {
      area: "University Road, Board Bazaar",
      city: "Peshawar",
      distanceKm: 3.4,
      fullAddress: "Flat 201, Khyber Palace, Board Bazaar, University Road, Peshawar",
      coordinates: { lat: 34.001, lng: 71.478 },
    },
    postedAt: new Date(Date.now() - 380 * 60 * 1000).toISOString(),
    postedAgo: "6 hours ago",
    preferredVisitWindow: {
      date: "Sunday, 27 Oct",
      timeSlot: "11:00 AM - 02:00 PM",
    },
    customerSuggestedPrice: 800,
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    securityPin: "4418",
    photos: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-17",
      name: "Mrs. Tahira Qazi",
      phone: "+92 312 9900112",
      rating: 4.8,
      totalReviews: 33,
      area: "University Road",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "accepted", // Upcoming visit 10
  },
  {
    id: "job-106",
    title: "Exterior Boundary Wall Weather-Shield & Main Gate Enamel",
    category: "Painter",
    urgency: "flexible",
    problemSummary: "45-foot front wall painting + scraping rust off iron boundary gate.",
    description:
      "Front boundary wall has monsoon rain streaks and peeling paint. Need scraping, acrylic putty filling, and two coats of weather-shield paint. Metal gate requires red oxide primer + black enamel.",
    location: {
      area: "DHA Phase 1, Ring Road",
      city: "Peshawar",
      distanceKm: 7.2,
      fullAddress: "Plot 88, Sector A, DHA Peshawar",
      coordinates: { lat: 33.972, lng: 71.411 },
    },
    postedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    postedAgo: "3 hours ago",
    preferredVisitWindow: {
      date: "Flexible this weekend",
      timeSlot: "Anytime morning",
    },
    customerSuggestedPrice: 400,
    photos: [
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-6",
      name: "Malik Zubair",
      phone: "+92 321 4433221",
      rating: 4.6,
      totalReviews: 8,
      area: "DHA Phase 1",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 0,
    status: "open",
  },
  {
    id: "job-107",
    title: "Honda 3.5kVA Generator Carburetor Overhaul & Oil Change",
    category: "Mechanic",
    urgency: "standard",
    problemSummary: "Generator surging under load, spark plug fouled with black soot.",
    description:
      "Gasoline generator RPM fluctuates wildly when AC is turned on. Requires carburetor sonic bath or needle valve cleaning, fresh 20W-50 oil replacement, and governor spring adjustment.",
    location: {
      area: "Kohat Road Industrial Area",
      city: "Peshawar",
      distanceKm: 8.5,
      fullAddress: "Factory Compound, Kohat Road, Peshawar",
      coordinates: { lat: 33.955, lng: 71.528 },
    },
    postedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    postedAgo: "4 hours ago",
    preferredVisitWindow: {
      date: "Today, 24 Oct",
      timeSlot: "05:00 PM - 07:00 PM",
    },
    customerSuggestedPrice: 700,
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-7",
      name: "Usman Durrani",
      phone: "+92 334 9988776",
      rating: 4.8,
      totalReviews: 12,
      area: "Kohat Road",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 4,
    status: "open",
  },
  {
    id: "job-108",
    title: "Concealed Geyser Pipe Leak & Pressure Valve Replacement",
    category: "Plumber",
    urgency: "emergency",
    problemSummary: "High pressure inlet leak behind bathroom tiles resolved.",
    description:
      "Repaired 25mm PPRC hot water line joint leak, installed high-pressure Italian non-return safety valve, and pressure tested water lines at 4.5 bar.",
    location: {
      area: "Hayatabad Phase 4, Peshawar",
      city: "Peshawar",
      distanceKm: 3.1,
      fullAddress: "House 312, Street 14, Sector N-3, Hayatabad Phase 4, Peshawar",
      coordinates: { lat: 33.978, lng: 71.438 },
    },
    postedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    postedAgo: "1 day ago",
    preferredVisitWindow: {
      date: "Yesterday",
      timeSlot: "11:00 AM - 01:00 PM",
    },
    customerSuggestedPrice: 500,
    visitCharge: 500,
    repairCharge: 1900,
    platformCommission: 240,
    workerNetEarnings: 2160,
    completedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    invoiceNumber: "INV-2026-8812",
    warrantyDays: 30,
    customerReview: {
      rating: 5,
      comment: "Shahzad arrived on time and fixed the geyser pipe leakage neatly without damaging excessive tiles. Highly skilled and honest technician!",
      date: "Yesterday, 02:45 PM",
    },
    photos: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-8",
      name: "Engr. Muhammad Sohail",
      phone: "+92 300 5566778",
      rating: 5.0,
      totalReviews: 24,
      area: "Hayatabad Phase 4",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 2,
    status: "completed",
  },
  {
    id: "job-109",
    title: "Kitchen Exhaust Hood Motor Rewinding & Switch Replacement",
    category: "Electrician",
    urgency: "standard",
    problemSummary: "Replaced 3-speed selector switch and balanced high-CFM suction impeller.",
    description:
      "Exhaust motor was humming and seized due to grease accumulation. Cleaned bearings, lubricated with high-temp grease, and rewired touch switch panel.",
    location: {
      area: "University Town, Park Road",
      city: "Peshawar",
      distanceKm: 2.7,
      fullAddress: "Villa 9-C, Park Road, University Town, Peshawar",
      coordinates: { lat: 34.002, lng: 71.492 },
    },
    postedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    postedAgo: "3 days ago",
    preferredVisitWindow: {
      date: "3 days ago",
      timeSlot: "03:00 PM - 05:00 PM",
    },
    customerSuggestedPrice: 400,
    visitCharge: 400,
    repairCharge: 1400,
    platformCommission: 180,
    workerNetEarnings: 1620,
    completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
    invoiceNumber: "INV-2026-8740",
    warrantyDays: 15,
    customerReview: {
      rating: 4.9,
      comment: "Very polite technician. Restored our kitchen hood suction back to original power. Transparent pricing and invoice receipt provided.",
      date: "3 days ago",
    },
    photos: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    ],
    customer: {
      id: "cust-9",
      name: "Dr. Saima Bilal",
      phone: "+92 313 7788990",
      rating: 4.9,
      totalReviews: 18,
      area: "University Town",
      isVerified: true,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
    totalOffers: 1,
    status: "completed",
  },
];

const INITIAL_OFFERS: Record<string, VisitOffer> = {
  "job-103": {
    id: "off-103",
    jobId: "job-103",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    message: "Certified electrician with clamp meter and spare breaker stock. Will reach in 25 mins.",
    status: "accepted",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 800,
        message: "Offer of Rs. 800 sent.",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 800,
  },
  "job-104": {
    id: "off-104",
    jobId: "job-104",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 1000,
    platformCommission: 100,
    workerNetEarnings: 900,
    message: "AC technician with manifold pressure gauge and R410A refrigerant canister.",
    status: "accepted",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 1000,
        message: "Agreed to visit fee of Rs. 1,000.",
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 1000,
  },
  "job-105": {
    id: "off-105",
    jobId: "job-105",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 600,
    platformCommission: 60,
    workerNetEarnings: 540,
    message: "Experienced carpenter with German clip-on hinges and track rollers.",
    status: "accepted",
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 600,
        message: "Visit quote Rs. 600 accepted by customer.",
        createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 600,
  },
  "job-110": {
    id: "off-110",
    jobId: "job-110",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    message: "Electrician with heavy-duty copper lug crimper and battery tester.",
    status: "accepted",
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 800,
        message: "Agreed visit fee Rs. 800.",
        createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 800,
  },
  "job-111": {
    id: "off-111",
    jobId: "job-111",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 900,
    platformCommission: 90,
    workerNetEarnings: 810,
    message: "Submersible pump specialist with replacement run capacitors.",
    status: "accepted",
    createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 900,
        message: "Agreed visit fee Rs. 900.",
        createdAt: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 900,
  },
  "job-112": {
    id: "off-112",
    jobId: "job-112",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 1200,
    platformCommission: 120,
    workerNetEarnings: 1080,
    message: "AC blower overhaul & chemical foam service kit ready.",
    status: "accepted",
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 1200,
        message: "Agreed visit fee Rs. 1,200.",
        createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 1200,
  },
  "job-113": {
    id: "off-113",
    jobId: "job-113",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 1000,
    platformCommission: 100,
    workerNetEarnings: 900,
    message: "Smart automation electrician with conduit & magnetic contactor toolkit.",
    status: "accepted",
    createdAt: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 1000,
        message: "Agreed visit fee Rs. 1,000.",
        createdAt: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 1000,
  },
  "job-114": {
    id: "off-114",
    jobId: "job-114",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 700,
    platformCommission: 70,
    workerNetEarnings: 630,
    message: "Plumber with pipe snake & sanitary sealant.",
    status: "accepted",
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 700,
        message: "Agreed visit fee Rs. 700.",
        createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 700,
  },
  "job-115": {
    id: "off-115",
    jobId: "job-115",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 1500,
    platformCommission: 150,
    workerNetEarnings: 1350,
    message: "Generator ATS electrical technician.",
    status: "accepted",
    createdAt: new Date(Date.now() - 280 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 1500,
        message: "Agreed visit fee Rs. 1,500.",
        createdAt: new Date(Date.now() - 280 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 1500,
  },
  "job-116": {
    id: "off-116",
    jobId: "job-116",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 1000,
    platformCommission: 100,
    workerNetEarnings: 900,
    message: "Door lock & wood carpentry specialist.",
    status: "accepted",
    createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 1000,
        message: "Agreed visit fee Rs. 1,000.",
        createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 1000,
  },
  "job-117": {
    id: "off-117",
    jobId: "job-117",
    workerId: "worker-me",
    workerName: "Shahzad Ahmad",
    visitCharge: 800,
    platformCommission: 80,
    workerNetEarnings: 720,
    message: "Stucco texture & damp proofing specialist.",
    status: "accepted",
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    currentRound: 1,
    maxRounds: 3,
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: 800,
        message: "Agreed visit fee Rs. 800.",
        createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
      },
    ],
    agreedVisitCharge: 800,
  },
};

export interface WorkerState {
  jobs: JobRequest[];
  offers: Record<string, VisitOffer>; // jobId -> VisitOffer
  inspectionReports: Record<string, InspectionReport>; // jobId -> InspectionReport
  filters: JobFeedFilters;
  workerOnline: boolean;
  walletBalance: number; // PKR (Rs.)
  walletHold: number; // Commission hold
  workerSkills: string[];
  workerArea: string;
}

const defaultFilters: JobFeedFilters = {
  category: "all",
  maxDistanceKm: 15,
  area: "Peshawar",
  sortBy: "fresh_first",
  onlyWithoutOffers: false,
  hideFarJobs: false,
};

let globalState: WorkerState = {
  jobs: INITIAL_JOBS,
  offers: INITIAL_OFFERS,
  inspectionReports: {},
  filters: defaultFilters,
  workerOnline: true,
  walletBalance: 1250, // Positive balance for testing (above -500 Rs. threshold)
  walletHold: 80, // Hold for active job 103
  workerSkills: ["Plumber", "Electrician", "AC Technician", "Carpenter", "Painter", "Mechanic"],
  workerArea: "Peshawar Urban Sector",
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const workerStore = {
  getState() {
    return globalState;
  },

  setFilter(update: Partial<JobFeedFilters>) {
    globalState = {
      ...globalState,
      filters: { ...globalState.filters, ...update },
    };
    notify();
  },

  resetFilters() {
    globalState = {
      ...globalState,
      filters: defaultFilters,
    };
    notify();
  },

  toggleOnline() {
    globalState = {
      ...globalState,
      workerOnline: !globalState.workerOnline,
    };
    notify();
  },

  setWalletBalance(amount: number) {
    globalState = {
      ...globalState,
      walletBalance: amount,
    };
    notify();
  },

  // Task 4 & Rule: One offer per job
  sendVisitOffer(jobId: string, visitCharge: number, message?: string): { success: boolean; error?: string } {
    if (globalState.offers[jobId]) {
      return {
        success: false,
        error: "You have already sent an offer for this job. Only ONE offer per job is permitted.",
      };
    }

    const commission = Math.round(visitCharge * 0.1); // 10% platform commission
    const net = visitCharge - commission;

    const newOffer: VisitOffer = {
      id: `off-${Date.now()}`,
      jobId,
      workerId: "worker-me",
      workerName: "Shahzad Ahmad",
      visitCharge,
      platformCommission: commission,
      workerNetEarnings: net,
      message,
      status: "sent",
      createdAt: new Date().toISOString(),
      currentRound: 1,
      maxRounds: 3,
      counterHistory: [
        {
          round: 1,
          sender: "worker",
          amount: visitCharge,
          message: message ?? "Visit offer submitted.",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    globalState = {
      ...globalState,
      offers: {
        ...globalState.offers,
        [jobId]: newOffer,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "offer_sent" as const, totalOffers: j.totalOffers + 1 } : j
      ),
    };
    notify();

    // Trigger simulated socket or backend ping
    const s = getSocket();
    s?.emit("job:offer:submit", { jobId, visitCharge, message });

    return { success: true };
  },

  // Task 6: Accept customer's counter offer
  acceptCounterOffer(jobId: string): boolean {
    const offer = globalState.offers[jobId];
    if (!offer || !offer.customerCounterAmount) return false;

    const agreedPrice = offer.customerCounterAmount;
    const commission = Math.round(agreedPrice * 0.1);
    const net = agreedPrice - commission;

    const updatedOffer: VisitOffer = {
      ...offer,
      visitCharge: agreedPrice,
      platformCommission: commission,
      workerNetEarnings: net,
      agreedVisitCharge: agreedPrice,
      status: "accepted",
      counterHistory: [
        ...offer.counterHistory,
        {
          round: offer.currentRound,
          sender: "worker",
          amount: agreedPrice,
          message: `Agreed to customer counter offer of Rs. ${agreedPrice}. Price locked.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    globalState = {
      ...globalState,
      offers: {
        ...globalState.offers,
        [jobId]: updatedOffer,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "accepted" as const } : j
      ),
    };
    notify();
    return true;
  },

  // Task 6: Send worker counter-offer (Bounded Rounds: max 3)
  sendWorkerCounter(jobId: string, counterAmount: number, message?: string): { success: boolean; error?: string } {
    const offer = globalState.offers[jobId];
    if (!offer) return { success: false, error: "Offer not found" };

    if (offer.currentRound >= offer.maxRounds) {
      return {
        success: false,
        error: `Maximum negotiation rounds (${offer.maxRounds}) reached. No further counters allowed.`,
      };
    }

    const nextRound = offer.currentRound + 1;
    const commission = Math.round(counterAmount * 0.1);
    const net = counterAmount - commission;

    const updatedHistory: CounterHistoryItem[] = [
      ...offer.counterHistory,
      {
        round: nextRound,
        sender: "worker",
        amount: counterAmount,
        message: message ?? `Worker countered with Rs. ${counterAmount}`,
        createdAt: new Date().toISOString(),
      },
    ];

    const updatedOffer: VisitOffer = {
      ...offer,
      visitCharge: counterAmount,
      platformCommission: commission,
      workerNetEarnings: net,
      currentRound: nextRound,
      status: "sent",
      counterHistory: updatedHistory,
      customerCounterAmount: undefined,
      customerCounterMessage: undefined,
    };

    globalState = {
      ...globalState,
      offers: {
        ...globalState.offers,
        [jobId]: updatedOffer,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "offer_sent" as const } : j
      ),
    };
    notify();
    return { success: true };
  },

  // Task 8a: Start Visit -> visit_in_progress
  startVisit(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_in_progress" as const } : j
      ),
    };
    notify();
  },

  // Task 8b: I've Arrived -> visit_completed
  // Checks 10% commission hold from wallet.
  arriveAtSite(jobId: string): { success: boolean; error?: string; requiredHold?: number } {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const offer = globalState.offers[jobId];
    const visitCharge = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.customerSuggestedPrice ?? 500;
    const requiredHold = Math.round(visitCharge * 0.1); // 10% platform commission

    // Check wallet balance
    if (globalState.walletBalance < requiredHold) {
      return {
        success: false,
        error: "Insufficient wallet balance. Please top up before arriving.",
        requiredHold,
      };
    }

    globalState = {
      ...globalState,
      walletHold: globalState.walletHold + requiredHold,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_completed" as const } : j
      ),
    };
    notify();
    return { success: true, requiredHold };
  },

  // Task 8c: Start Inspection -> inspecting
  startInspection(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "inspecting" as const } : j
      ),
    };
    notify();
  },

  // Task 8d: Submit Inspection -> 5 required fields
  submitInspection(
    jobId: string,
    report: Omit<InspectionReport, "jobId" | "submittedAt">
  ): { success: boolean; error?: string } {
    if (!report.diagnosis?.trim()) {
      return { success: false, error: "Diagnosis is required." };
    }
    if (!report.repairPlan?.trim()) {
      return { success: false, error: "Repair plan is required." };
    }
    if (!report.repairPriceEstimate || report.repairPriceEstimate <= 0) {
      return { success: false, error: "A valid repair price estimate (Rs.) is required." };
    }
    if (!report.photos || report.photos.length === 0) {
      return { success: false, error: "At least one inspection photo is required as evidence." };
    }
    if (!report.estimatedRepairTime?.trim()) {
      return { success: false, error: "Estimated repair time is required." };
    }

    const fullReport: InspectionReport = {
      jobId,
      ...report,
      submittedAt: new Date().toISOString(),
    };

    globalState = {
      ...globalState,
      inspectionReports: {
        ...globalState.inspectionReports,
        [jobId]: fullReport,
      },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "inspection_submitted" as const } : j
      ),
    };
    notify();
    return { success: true };
  },

  // Cancel Job (Active pre-visit)
  cancelJob(jobId: string, reason: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "cancelled" as const } : j
      ),
    };
    notify();
  },

  // Simulation: Another worker assigned (Real-time Socket.IO trigger)
  simulateClosedAssigned(jobId: string) {
    const offer = globalState.offers[jobId];
    if (offer) {
      globalState = {
        ...globalState,
        offers: {
          ...globalState.offers,
          [jobId]: { ...offer, status: "closed_assigned" },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "closed_assigned" as const } : j
        ),
      };
      notify();
    }
  },

  // Simulation: Customer viewing offer
  simulateCustomerViewing(jobId: string) {
    const offer = globalState.offers[jobId];
    if (offer && offer.status === "sent") {
      globalState = {
        ...globalState,
        offers: {
          ...globalState.offers,
          [jobId]: { ...offer, status: "viewing" },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "customer_viewing" as const } : j
        ),
      };
      notify();
    }
  },

  // Simulation: Customer sent counter
  simulateCustomerCounter(jobId: string, counterAmount: number, message: string) {
    const offer = globalState.offers[jobId];
    if (offer) {
      const nextRound = offer.currentRound + 1;
      const updatedHistory: CounterHistoryItem[] = [
        ...offer.counterHistory,
        {
          round: nextRound,
          sender: "customer",
          amount: counterAmount,
          message,
          createdAt: new Date().toISOString(),
        },
      ];

      globalState = {
        ...globalState,
        offers: {
          ...globalState.offers,
          [jobId]: {
            ...offer,
            currentRound: nextRound,
            status: "counter_received",
            customerCounterAmount: counterAmount,
            customerCounterMessage: message,
            counterHistory: updatedHistory,
          },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "counter_received" as const } : j
        ),
      };
      notify();
    }
  },

  approveRepair(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "repair_approved" as const } : j
      ),
    };
    notify();
  },

  declineRepair(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "repair_declined" as const } : j
      ),
    };
    notify();
  },

  startRepair(jobId: string) {
    globalState = {
      ...globalState,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "repair_in_progress" as const } : j
      ),
    };
    notify();
  },

  completeJob(jobId: string, repairCharge: number = 1500) {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const offer = globalState.offers[jobId];
    const visitFee = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.visitCharge ?? 500;
    const gross = visitFee + repairCharge;
    const commission = Math.round(gross * 0.1);
    const net = gross - commission;

    globalState = {
      ...globalState,
      walletBalance: globalState.walletBalance + net,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "completed" as const,
              repairCharge,
              visitCharge: visitFee,
              platformCommission: commission,
              workerNetEarnings: net,
              completedAt: new Date().toISOString(),
              invoiceNumber: `INV-2026-${jobId.slice(-4).toUpperCase()}`,
              warrantyDays: 30,
              customerReview: {
                rating: 5.0,
                comment: "Excellent service! The technician was very punctual and solved the issue quickly.",
                date: "Just now",
              },
            }
          : j
      ),
    };
    notify();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// React Hook for consuming the store
export function useWorkerJobs() {
  const [state, setState] = useState<WorkerState>(workerStore.getState());

  useEffect(() => {
    return workerStore.subscribe(() => {
      setState(workerStore.getState());
    });
  }, []);

  return state;
}
