/* ============================================
   BetaBanner.jsx
   Vestige — Ashborne
   Beta banner — shown on the dashboard to
   inform users the app is in beta and invite
   feedback. Dismissible via localStorage so
   it only shows once per device.
   ============================================ */

import { useState, useEffect } from 'react'
import styles from '../styles/BetaBanner.module.css'

export default function BetaBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    /* Only show if user hasn't dismissed it before */
    const dismissed = localStorage.getItem('vestige-beta-dismissed')
    if (!dismissed) setVisible(true)
  }, [])

  function handleDismiss() {
    localStorage.setItem('vestige-beta-dismissed', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner}>
      <div className={styles.left}>
        <span className={styles.badge}>Beta</span>
        <p className={styles.message}>
          Vestige is in early beta — your feedback directly shapes what gets built next.
        </p>
      </div>
      <div className={styles.actions}>
        <a
          href="https://forms.gle/r4DuEUrXf3zkuHh69"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.feedbackButton}
        >
          Give Feedback
        </a>
        <button
          className={styles.dismissButton}
          onClick={handleDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}