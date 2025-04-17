import type { AppProps } from 'next/app';
import '../styles/globals.css'; // 👈 importa seu CSS global aqui

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
