import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Habag at Karera",
  description: "Isang karera ng kaalaman at pagtutulungan",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fil">
      <body>
        <a href="#main-content" className="skip-link">
          Dumiretso sa nilalaman
        </a>
        {children}
      </body>
    </html>
  );
}
