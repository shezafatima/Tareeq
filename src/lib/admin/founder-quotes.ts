// The founder's note on the admin dashboard (specs/029-admin-dashboard FR-025). One quote a day, the same all day and
// new at each Karachi midnight. Pure: relative import only, so unit tests can load it.
//
// Every line is original and drawn only from what the founder has said about herself: school, quizzes, drawing, code,
// AI, content, overthinking, "let's just try". Nothing claims an achievement she has not described. Public pages never
// show these; they live in the admin panel only.

import { karachiDayNumber } from "./dashboard-time.ts";

export const FOUNDER_QUOTES: readonly string[] = [
  // deeper
  "Fear got a vote. It never got the final say.",
  "Nobody came to tell me to stand up, so I stood up. It turns out that works.",
  "I was never waiting to be ready. I was waiting to be brave, and brave arrives after you start.",
  "Courage, in my case, shows up late and red-eyed, and then does the thing anyway.",
  "Every time I doubt myself, I check the record. The record keeps winning.",
  "Some people wait for a sign. I read my own history instead.",
  "I want my younger self to look at today and say: oh, so we did try.",
  "Tareeq means path. Mine mostly got built by walking it before it existed.",
  "Nobody pushed me, so I learned to push from the inside. It is quieter and it lasts longer.",
  "Not every day has to feel brave. Some days it only has to get done.",
  "Overthinking gets the first draft. Courage gets the final edit.",
  "Fourth place was not first place. It was the day the stairs stopped winning.",
  // witty
  "Let's just try: the smallest sentence with the longest commit history.",
  "School topper, quiz competitor, now founder. The syllabus keeps growing and nobody sends notes.",
  "Pixels, pencils, prompts. The medium changes; the stubbornness does not.",
  "I sketch faces, ship features and overthink replies. Range.",
  "Sketching faces taught me that it looks wrong until the last few lines make it right. Keep drawing.",
  "Cleared the big exams on the first attempt. The second-guessing, however, always gets more attempts.",
  "Started making content before I felt ready. Ready, it turns out, is a rumour.",
  "Calm face, loud mind. The calendar usually wins the argument.",
  "I learned AI the way I learned everything else: stubbornly, and then slightly obsessively.",
  "Sensitive heart, strict deadline. They have learned to share a desk.",
  "Quiet on the outside, a full group chat on the inside. The group chat only moves after the decision is made.",
  "A lesson from the quiz stage: nervous hands, steady answers.",
  // funny
  "git commit -m \"was scared, did it anyway\"",
  "Ship first, panic in the changelog.",
  "I was told I wear many hats. I would like one hat, please, with a reliable deploy button.",
  "My to-do list has its own to-do list. Naturally.",
  "Debugging code is easy. Debugging the feeling before posting a video takes longer.",
  "Hit publish before the doubts finished their meeting.",
  "Elder daughter energy: figure it out, then make it look easy.",
  "Open tabs: the website, the curriculum, the content calendar, and one worried thought about all three.",
  "A hundred things at once is not a personality. It is a scheduling problem, and I debug those.",
  "Self-motivation is a free subscription with a very stubborn billing cycle.",
  // sarcastic
  "No pep talk arrived, so I wrote one and then followed it. Efficient, if unusual.",
  "Overthinking is just planning with no budget for confidence.",
  "I cry, I regroup, I send the email. The order of operations matters.",
  "Ambition and anxiety can share a laptop, as long as ambition holds the keyboard.",
  "An AI engineer on paper; in practice, a professional at 'let me try just one more thing'.",
  "Not a perfect plan. A working one, which I will improve in public and complain about in private.",
];

const N = FOUNDER_QUOTES.length;
/** Walks the list in a fixed scrambled order, so neighbouring days are unrelated. Must share no factor with N. */
export const QUOTE_STEP = 7;

/** The index of the day's quote: it visits every quote once before any repeats. */
export function quoteIndexForDay(dayNumber: number): number {
  return (((dayNumber * QUOTE_STEP) % N) + N) % N;
}

/** Today's quote (Karachi calendar day). The same all day; a different one from Karachi midnight. */
export function quoteOfTheDay(now: Date): string {
  return FOUNDER_QUOTES[quoteIndexForDay(karachiDayNumber(now))];
}
