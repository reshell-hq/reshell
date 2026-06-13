export type QuoteTheme = "design" | "innovation" | "engineering" | "coding" | "productivity";

export type Quote = {
  text: string;
  theme: QuoteTheme;
};

export const QUOTES: Quote[] = [
  {
    theme: "coding",
    text: "Complexity many. Simple good. Grug no trust code what need diagram bigger than cave.",
  },
  {
    theme: "engineering",
    text: "Make it work, then make it clear, then make it fast — usually in that order.",
  },
  {
    theme: "design",
    text: "Good design is as little design as possible.",
  },
  {
    theme: "productivity",
    text: "Focus is saying no to the hundred other good ideas.",
  },
  {
    theme: "innovation",
    text: "The best way to predict the future is to invent it.",
  },
];

export function pickQuote(seed: number): Quote {
  const index = ((seed % QUOTES.length) + QUOTES.length) % QUOTES.length;
  return QUOTES[index]!;
}
