import './globals.css';

export const metadata = {
  title: 'FacilityH2O — Water Chemistry Compliance. Simplified.',
  description:
    'Track boiler and chilled water readings across all your facilities. Stay compliant. Get alerted instantly.',
  icons: { icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="32" font-size="32">💧</text></svg>' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`body { font-family: 'Inter', sans-serif; }`}</style>
      </head>
      <body className="bg-sky-50 min-h-screen">{children}</body>
    </html>
  );
}
