export type SessionLevel = "all" | "beginner" | "intermediate" | "advanced";

export type Instructor = { name: string; covering: boolean };

export type Session = {
  id: string;
  name: string;
  room: string;
  instructor: Instructor;
  startsAt: string;
  durationMin: number;
  capacity: number;
  booked: number;
  waitlisted: number;
  checkedIn: number;
  level: SessionLevel;
  equipment: string;
  priceGbp: number;
  status: "scheduled" | "full" | "cancelled";
  cancellationReason?: string;
};

const NAMES = [
  "Vinyasa Flow",
  "Reformer Pilates",
  "Strength & Conditioning",
  "Sunrise Yoga",
  "Spin Interval",
  "Barre Sculpt",
  "Deep Stretch",
  "Boxing Fundamentals",
  "Mobility & Recovery",
  "Advanced Reformer Pilates for Posture and Alignment",
];
const ROOMS = ["Studio 1", "Studio 2", "Mezzanine", "Annexe"];
const INSTRUCTORS = [
  "Ama Osei",
  "Ben Carter",
  "Chiara Ricci",
  "Dev Patel",
  "Elin Larsen",
  "Farid Haddad",
];
const LEVELS: SessionLevel[] = ["all", "beginner", "intermediate", "advanced"];
const EQUIPMENT = [
  "Mat",
  "Reformer",
  "Kettlebells",
  "Spin bike",
  "Barre + band",
  "None",
];
const DURATIONS = [30, 45, 50, 60, 75, 90];

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function isoAt(seed: number, hour: number, minute: number): string {
  const year = Math.floor(seed / 10000);
  const month = Math.floor((seed % 10000) / 100);
  const day = seed % 100;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00Z`;
}

function pick<T>(random: () => number, list: readonly T[], fallback: T): T {
  return list[Math.floor(random() * list.length)] ?? fallback;
}

const CANCELLATION_REASONS = [
  "Instructor unwell",
  "Studio maintenance",
  "Below minimum numbers",
  "Equipment fault",
];

export function dateSeed(date: Date): number {
  return (
    date.getUTCFullYear() * 10000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate()
  );
}

export function createSessions(count: number, seed = 20260816): Session[] {
  const random = lcg(seed);
  const sessions: Session[] = [];

  for (let index = 0; index < count; index++) {
    const capacity = 8 + Math.floor(random() * 18);
    const booked =
      random() < 0.22
        ? capacity + Math.floor(random() * 4)
        : Math.floor(random() * (capacity + 1));
    const hour = 6 + Math.floor(random() * 15);
    const minute = random() < 0.5 ? 0 : 30;

    const cancelled = random() < 0.08;
    const status: Session["status"] = cancelled
      ? "cancelled"
      : booked >= capacity
        ? "full"
        : "scheduled";

    sessions.push({
      id: `s${index}`,
      name: pick(random, NAMES, "Vinyasa Flow"),
      room: pick(random, ROOMS, "Studio 1"),
      instructor: {
        name: pick(random, INSTRUCTORS, "Ama Osei"),
        covering: random() < 0.15,
      },
      startsAt: isoAt(seed, hour, minute),
      durationMin: pick(random, DURATIONS, 45),
      capacity,
      booked,
      waitlisted: booked > capacity ? booked - capacity : 0,
      checkedIn: cancelled
        ? 0
        : Math.floor(Math.min(booked, capacity) * random()),
      level: pick(random, LEVELS, "all"),
      equipment: pick(random, EQUIPMENT, "Mat"),
      priceGbp: 8 + Math.floor(random() * 22) + (random() < 0.5 ? 0 : 0.5),
      status,
      cancellationReason: cancelled
        ? pick(random, CANCELLATION_REASONS, "Instructor unwell")
        : undefined,
    });
  }

  return sessions;
}

export type Attendee = {
  id: string;
  customerName: string;
  paymentType: "one_time" | "package" | "membership";
  bookingStatus: "booked" | "checked_in" | "cancelled" | "no_show";
  packageRemaining?: number;
  isFirstVisit: boolean;
};

const FIRST = [
  "Aoife",
  "Marcus",
  "Priya",
  "Tomas",
  "Nia",
  "Oskar",
  "Leila",
  "Rhys",
];
const LAST = [
  "Byrne",
  "Adeyemi",
  "Nowak",
  "Silva",
  "Khan",
  "Fischer",
  "Moreau",
];
const PAYMENTS: Attendee["paymentType"][] = [
  "one_time",
  "package",
  "membership",
];
const BOOKING: Attendee["bookingStatus"][] = [
  "booked",
  "checked_in",
  "cancelled",
  "no_show",
];

export function createAttendees(session: Session): Attendee[] {
  const seed = session.id
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 7);
  const random = lcg(seed * 9301);
  const count = Math.min(session.booked, session.capacity);

  return Array.from({ length: count }, (_, index) => {
    const paymentType = pick(random, PAYMENTS, "one_time");
    return {
      id: `${session.id}-a${index}`,
      customerName: `${pick(random, FIRST, "Aoife")} ${pick(random, LAST, "Byrne")}`,
      paymentType,
      bookingStatus: pick(random, BOOKING, "booked"),
      packageRemaining:
        paymentType === "package" ? 1 + Math.floor(random() * 9) : undefined,
      isFirstVisit: random() < 0.18,
    };
  });
}
