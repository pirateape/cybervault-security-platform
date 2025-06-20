import './global.css';
import './cybervault.css';
import './accessibility.css';
import { Providers } from '../components/Providers';

export const metadata = {
  title: 'CyberVault - Compliance Management Platform',
  description: 'Comprehensive cybersecurity compliance management and monitoring platform',
};

export const viewport = {
  themeColor: '#1e40af',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#sidebar" className="skip-link">
          Skip to navigation
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
