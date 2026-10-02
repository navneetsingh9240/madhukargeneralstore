import './globals.css';
import LayoutClient from './layout-client';

export const metadata = {
  title: 'Madhukar General Store — Fresh Groceries Delivered',
  description: 'Production-Ready E-Commerce & Delivery Platform for Madhukar General Store. Fresh groceries, daily essentials, staples & dairy delivered with mandatory PIN code check and digital QR billing.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
