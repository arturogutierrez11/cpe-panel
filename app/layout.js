import "./globals.css";

export const metadata = {
  title: "MELI Promotions Command Center",
  description: "Panel operativo para participacion y desparticipacion de promociones"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
