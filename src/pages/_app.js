import Navbar from '../components/Navbar'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { BreadcrumbProvider } from '../lib/BreadcrumbContext'

export default function App({ Component, pageProps }) {
  return (
    <BreadcrumbProvider>
      <Navbar />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--colour-bg-card)',
            color: 'var(--colour-text-primary)',
            border: '1px solid var(--colour-border)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8rem',
            letterSpacing: '0.05em',
          },
          success: {
            iconTheme: {
              primary: '#4a7c59',
              secondary: '#f5f5f0',
            },
          },
          error: {
            iconTheme: {
              primary: '#b94040',
              secondary: '#f5f5f0',
            },
          },
        }}
      />
      <Component {...pageProps} />
    </BreadcrumbProvider>
  )
}