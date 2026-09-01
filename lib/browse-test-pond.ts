/**
 * TEST ONLY preview seed for the Home shortlist slideshow.
 * Strip this module before merging to main. Do not treat these as live inventory.
 * Fail closed on the real table when this seed is removed.
 * Pinned preview portraits live under public/preview/pins. Not live photos.
 */
import type { BrowseProfile } from "./profile-search";
import { BROWSE_PIN_CAP, BROWSE_PIN_PHOTO_DIR, takePinnedIds } from "./browse-pin";

/** Live Home stays fail closed. Keep this false so seed people never render. */
export const BROWSE_TEST_SEED_ENABLED = false;
export const BROWSE_TEST_SEED_COUNT = 20;

type TestSeed = {
  id: string;
  name: string;
  city: string;
  work: string;
  education: string;
  langs: string;
  diet: string;
  online: boolean;
  note: string;
  pinned?: boolean;
  photo?: string;
};

function pinPhoto(file: string) {
  return BROWSE_PIN_PHOTO_DIR + "/" + file;
}

function asTestProfile(row: TestSeed): BrowseProfile {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    work: row.work,
    education: row.education,
    langs: row.langs,
    diet: row.diet,
    visa: "",
    gender: "",
    note: row.note,
    promptLabel: "About",
    photoUrl: row.photo || "",
    verified: false,
    online: row.online,
    instagram: "",
    biodataShare: false,
  };
}

/** Twenty Soft Minimal cards. Pinned preview cards carry in-repo portraits. */
export const BROWSE_TEST_SEEDS: TestSeed[] = [
  { id: "test-pond-01", name: "Arjun Mehta", city: "Dallas", work: "Software engineer", education: "MS", langs: "Gujarati", diet: "Vegetarian", online: true, note: "I cook on Sundays and keep a small garden on the balcony.", pinned: true, photo: pinPhoto("pin-arjun.webp") },
  { id: "test-pond-02", name: "Nisha Reddy", city: "Austin", work: "Pediatrician", education: "MD", langs: "Telugu", diet: "Vegetarian", online: false, note: "Weekends are for family breakfast and a long walk." },
  { id: "test-pond-03", name: "Vikram Shah", city: "London", work: "Product manager", education: "MBA", langs: "Gujarati", diet: "Vegetarian", online: true, note: "I like quiet bookshops and a Saturday cricket match." },
  { id: "test-pond-04", name: "Diya Kapoor", city: "Chicago", work: "Architect", education: "MArch", langs: "Hindi", diet: "Vegetarian", online: false, note: "I sketch buildings and cook dal when friends come over.", pinned: true, photo: pinPhoto("pin-diya.webp") },
  { id: "test-pond-05", name: "Sahil Iyer", city: "Seattle", work: "Data scientist", education: "PhD", langs: "Tamil", diet: "Eggetarian", online: true, note: "I hike when the rain lets up and call home every Friday." },
  { id: "test-pond-06", name: "Leela Nair", city: "Toronto", work: "Dentist", education: "DDS", langs: "Malayalam", diet: "Vegetarian", online: false, note: "I keep a simple kitchen and a packed calendar of cousins." },
  { id: "test-pond-07", name: "Sameer Joshi", city: "San Jose", work: "Hardware engineer", education: "MS", langs: "Marathi", diet: "Vegetarian", online: true, note: "I repair old radios and host chai on the patio.", pinned: true, photo: pinPhoto("pin-sameer.webp") },
  { id: "test-pond-08", name: "Ishita Bose", city: "Boston", work: "Lawyer", education: "JD", langs: "Bengali", diet: "Vegetarian", online: false, note: "I read case law by day and Bengali poetry at night." },
  { id: "test-pond-09", name: "Nikhil Rao", city: "Atlanta", work: "Consultant", education: "MBA", langs: "Kannada", diet: "Vegetarian", online: true, note: "I travel for work and look for a kitchen that feels like home." },
  { id: "test-pond-10", name: "Tanvi Desai", city: "Houston", work: "Teacher", education: "MEd", langs: "Gujarati", diet: "Vegetarian", online: false, note: "I teach fifth grade and grow tomatoes on the porch.", pinned: true, photo: pinPhoto("pin-tanvi.webp") },
  { id: "test-pond-11", name: "Aditya Menon", city: "Dublin", work: "Finance", education: "CFA", langs: "Malayalam", diet: "Vegetarian", online: true, note: "I run along the canal and send voice notes to my parents." },
  { id: "test-pond-12", name: "Sneha Kulkarni", city: "Sydney", work: "Researcher", education: "PhD", langs: "Marathi", diet: "Vegetarian", online: false, note: "I write slowly and keep Sunday lunch for whoever is in town." },
  { id: "test-pond-13", name: "Karan Malhotra", city: "New Jersey", work: "Physician", education: "MD", langs: "Punjabi", diet: "Vegetarian", online: true, note: "Hospital weeks are long. I want someone who likes quiet evenings.", pinned: true, photo: pinPhoto("pin-karan.webp") },
  { id: "test-pond-14", name: "Rhea Banerjee", city: "Washington", work: "Journalist", education: "MA", langs: "Bengali", diet: "Eggetarian", online: false, note: "I ask too many questions and cook khichdi when a story ends." },
  { id: "test-pond-15", name: "Dev Patel", city: "Phoenix", work: "Founder", education: "BTech", langs: "Gujarati", diet: "Vegetarian", online: true, note: "I build small tools and call my sister every other night." },
  { id: "test-pond-16", name: "Anika Sharma", city: "Denver", work: "Therapist", education: "MSW", langs: "Hindi", diet: "Vegetarian", online: false, note: "I keep evenings screen light and mornings for a walk.", pinned: true, photo: pinPhoto("pin-anika.webp") },
  { id: "test-pond-17", name: "Harsh Vora", city: "Singapore", work: "Analyst", education: "MS", langs: "Gujarati", diet: "Vegetarian", online: true, note: "I take the long way home if the weather is kind." },
  { id: "test-pond-18", name: "Pooja Sen", city: "Minneapolis", work: "Nurse", education: "BSN", langs: "Bengali", diet: "Vegetarian", online: false, note: "Night shifts end with tea and a call to my mother." },
  { id: "test-pond-19", name: "Rahul Nanda", city: "Raleigh", work: "Civil engineer", education: "MS", langs: "Hindi", diet: "Vegetarian", online: true, note: "I like maps, trains, and a kitchen that smells like jeera." },
  { id: "test-pond-20", name: "Shreya Pillai", city: "Portland", work: "Designer", education: "MFA", langs: "Malayalam", diet: "Vegetarian", online: false, note: "I paint on weekends and keep a short list of favorite bakeries." },
];

export const BROWSE_TEST_PROFILES: BrowseProfile[] = BROWSE_TEST_SEEDS.map(asTestProfile);

export const BROWSE_TEST_PINNED_IDS = takePinnedIds(
  BROWSE_TEST_SEEDS.filter(function (row) {
    return row.pinned;
  }).map(function (row) {
    return row.id;
  }),
  BROWSE_PIN_CAP
);

export function browseShortlistPond(live: BrowseProfile[]) {
  if (BROWSE_TEST_SEED_ENABLED) return BROWSE_TEST_PROFILES.slice();
  return Array.isArray(live) ? live : [];
}

export function browsePinnedPreview() {
  if (!BROWSE_TEST_SEED_ENABLED) return [];
  const pinned = new Set(BROWSE_TEST_PINNED_IDS);
  return BROWSE_TEST_PROFILES.filter(function (profile) {
    return pinned.has(profile.id);
  }).slice(0, BROWSE_PIN_CAP);
}
