import './globals.css';
import './glass.css';
export const metadata = {
  title: 'Fig Mail', description: process.env.NEXT_PUBLIC_INBOX_ADDRESS || 'A private mail client', manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }] },
  appleWebApp: { capable: true, title: 'Fig Mail', statusBarStyle: 'black-translucent' },
  other: { 'mobile-web-app-capable': 'yes' },
  formatDetection: { telephone: false, email: false, address: false },
};
export const viewport = {
  width: 'device-width', initialScale: 1, viewportFit: 'cover',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#ffffff' }, { media: '(prefers-color-scheme: dark)', color: '#000000' }],
};
// Apply the saved theme before first paint (no flash), and flag standalone (home-screen) mode.
const boot = `try{var t=JSON.parse(localStorage.getItem('fig:theme')||'null');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;
if(navigator.standalone||matchMedia('(display-mode: standalone)').matches)document.documentElement.classList.add('standalone');}catch(e){}`;
export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: boot }} /></head><body>{children}</body></html>;
}
