import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "shiatsu-backend",
  description: "Backend API host"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
