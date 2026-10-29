import './index.css';
import ClientCounter from './client.tsx';

export function Root(props: { url: URL }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>SwyftPain - Language &amp; Code Mentorship</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Anti-FOUC inline script for instant theme application */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var saved = localStorage.getItem('swyftpain-theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })()`,
          }}
        />
      </head>
      <body className="bg-[#EEF1F8] text-[#121633] dark:bg-[#0c0f24] dark:text-[#f0f3fe] antialiased">
        <App {...props} />
      </body>
    </html>
  );
}

function App(props: { url: URL }) {
  return (
    <div id="root">
      <ClientCounter />
    </div>
  );
}
