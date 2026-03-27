/* ============================================
    Flashcard.jsx
    Vestige — Ashborne
    Reusable flashcard component with CSS flip
    animation. Shows the front by default, flips
    to reveal the back on click or spacebar press.
   ============================================ */

import { useEffect, useState } from 'react'
import styles from '../styles/Flashcard.module.css'

export default function Flashcard({ front, back, onCorrect, onIncorrect }) {
    const [flipped, setFlipped] = useState(false)

    /* Reset the flip state when a new card is passed in —
        so each new card always starts showing the front */
    useEffect(() => {
        /* Deferred reset prevents cascading render warning
        in React 19 — resets card to front on each new card */
        const timer = setTimeout(() => setFlipped(false), 0)
        return () => clearTimeout(timer)
    }, [front])

    /* Keyboard shortcuts:
        Space — flip the card
        Right arrow — mark correct (only after flipping)
        Left arrow — mark incorrect (only after flipping) */
    useEffect(() => {
        function handleKeyDown(e) {
        if (e.code === 'Space') {
            e.preventDefault()
            setFlipped(f => !f)
        }
        if (e.code === 'ArrowRight' && flipped) {
            e.preventDefault()
            onCorrect()
        }
        if (e.code === 'ArrowLeft' && flipped) {
            e.preventDefault()
            onIncorrect()
        }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [flipped, onCorrect, onIncorrect])

    return (
        <div className={styles.wrapper}>

        {/* The card container — clicking flips it */}
        <div
            className={`${styles.card} ${flipped ? styles.flipped : ''}`}
            onClick={() => setFlipped(!flipped)}
        >
            {/* Front face */}
            <div className={styles.front}>
            <span className={styles.faceLabel}>Question</span>
            <p className={styles.cardText}>{front}</p>
            <span className={styles.flipHint}>Click or press space to flip</span>
            </div>

            {/* Back face */}
            {/* Back face */}
        <div className={styles.back}>
            <span className={styles.faceLabel}>Answer</span>
            <p className={styles.cardText}>{back}</p>
            {/* Keyboard shortcut hints shown on back face */}
            <span className={styles.flipHint}>← incorrect · correct →</span>
            </div>
        </div>

        {/* Correct/incorrect buttons — only shown after flip */}
        {flipped && (
            <div className={styles.actions}>
            <button
                className={styles.incorrectButton}
                onClick={onIncorrect}
            >
                ✗ Incorrect
            </button>
            <button
                className={styles.correctButton}
                onClick={onCorrect}
            >
                ✓ Correct
            </button>
            </div>
        )}

        </div>
    )
}