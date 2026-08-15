export type SessionLevel = "all" | "beginner" | "intermediate" | "advanced";

export type Session = {
  id: string;
  name: string;
  room: string;
  instructor: string;
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

function pick<T>(random: () => number, list: readonly T[], fallback: T): T {
  return list[Math.floor(random() * list.length)] ?? fallback;
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
      instructor: pick(random, INSTRUCTORS, "Ama Osei"),
      startsAt: `2026-08-16T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`,
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
    });
  }

  return sessions;
}
