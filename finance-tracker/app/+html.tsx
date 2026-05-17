import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'InstrumentSerif_400Regular';
              src: url('/fonts/InstrumentSerif_400Regular.ttf') format('truetype');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'InstrumentSerif_400Regular_Italic';
              src: url('/fonts/InstrumentSerif_400Regular_Italic.ttf') format('truetype');
              font-weight: 400;
              font-style: italic;
              font-display: swap;
            }
            @font-face {
              font-family: 'Inter_400Regular';
              src: url('/fonts/Inter_400Regular.ttf') format('truetype');
              font-weight: 400;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Inter_500Medium';
              src: url('/fonts/Inter_500Medium.ttf') format('truetype');
              font-weight: 500;
              font-style: normal;
              font-display: swap;
            }
            @font-face {
              font-family: 'Inter_600SemiBold';
              src: url('/fonts/Inter_600SemiBold.ttf') format('truetype');
              font-weight: 600;
              font-style: normal;
              font-display: swap;
            }
          `,
        }} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
