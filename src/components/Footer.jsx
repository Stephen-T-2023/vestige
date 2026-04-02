/* ============================================
   Footer.jsx
   Vestige — Ashborne
   Global footer — shown on all pages except
   login and signup. Contains privacy policy
   link and Ashborne branding.
   ============================================ */

import { useRouter } from 'next/router'
import styles from '../styles/Footer.module.css'

export default function Footer() {
  const router = useRouter()

  /* Hide footer on auth pages */
  const hideOn = ['/login', '/signup']
  if (hideOn.includes(router.pathname)) return null

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.brand}>Vestige by Ashborne</span>
        <div className={styles.links}>
          <a href="/privacy" className={styles.link}>Privacy Policy</a>
          <span className={styles.dot}>·</span>
          <span className={styles.beta}>Beta</span>
        </div>
      </div>
    </footer>
  )
}