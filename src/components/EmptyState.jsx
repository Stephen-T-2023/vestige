/* ============================================
    EmptyState.jsx
    Vestige — Ashborne
    Reusable empty state component shown when
    a page has no content yet. Accepts a message
    and an optional action button.
   ============================================ */

import styles from '../styles/EmptyState.module.css'

export default function EmptyState({ message, hint }) {
    return (
        <div className={styles.container}>
        <div className={styles.icon}>◎</div>
        <p className={styles.message}>{message}</p>
        {hint && <p className={styles.hint}>{hint}</p>}
        </div>
    )
}