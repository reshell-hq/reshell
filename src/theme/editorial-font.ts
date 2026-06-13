import { DM_Sans } from "next/font/google";

// eslint-disable-next-line new-cap -- next/font/google uses PascalCase font loaders
export const editorialFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
