/* ============================================
    study/[id].jsx
    Vestige — Ashborne
    Study mode page — presents flashcards one at
    a time using the Flashcard component. Tracks
    correct and incorrect answers for the session
    and shows a summary at the end.
   ============================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'
import Flashcard from '../../components/flashcard'
import styles from '../../styles/Study.module.css'

export default function StudyPage() {
    const router = useRouter()
    const { id } = router.query

    const [topic, setTopic] = useState(null)
    const [cards, setCards] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [correct, setCorrect] = useState(0)
    const [incorrect, setIncorrect] = useState(0)
    const [finished, setFinished] = useState(false)
    const [loading, setLoading] = useState(true)

    /* Fetch the topic name and all its flashcards */
    async function fetchStudyData() {
        const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select('*, subjects(id, name)')
        .eq('id', id)
        .single()

        if (topicError) return

        setTopic(topicData)

        const { data: cardData, error: cardError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true })

        if (cardError) return

        setCards(cardData)
    }

    useEffect(() => {
        if (!id) return

        async function init() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
        } else {
            await fetchStudyData()
            setLoading(false)
        }
        }

        init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, router])

    /* Mark current card as correct and advance */
    function handleCorrect() {
        setCorrect(c => c + 1)
        advance()
    }

    /* Mark current card as incorrect and advance */
    function handleIncorrect() {
        setIncorrect(i => i + 1)
        advance()
    }

    /* Move to the next card or end the session
        if we've reached the last card */
    function advance() {
        if (currentIndex + 1 >= cards.length) {
        setFinished(true)
        } else {
        setCurrentIndex(currentIndex + 1)
        }
    }

    /* Shuffle the cards array using Fisher-Yates algorithm
        then reset the session back to the start */
    function handleShuffle() {
        const shuffled = [...cards]
        for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        setCards(shuffled)
        setCurrentIndex(0)
        setCorrect(0)
        setIncorrect(0)
        setFinished(false)
    }

    /* Restart the session with the same card order */
    function handleRestart() {
        setCurrentIndex(0)
        setCorrect(0)
        setIncorrect(0)
        setFinished(false)
    }

    if (loading) return null

    /* Current card being studied */
    const currentCard = cards[currentIndex]

    return (
        <div className={styles.container}>
        <header className={styles.header}>
            <h1 className={styles.logo}>Vestige</h1>
            <nav className={styles.breadcrumb}>
            <button onClick={() => router.push('/dashboard')}>Dashboard</button>
            <span>›</span>
            <button onClick={() => router.push(`/subject/${topic?.subjects?.id}`)}>
                {topic?.subjects?.name}
            </button>
            <span>›</span>
            <button onClick={() => router.push(`/topic/${id}`)}>
                {topic?.name}
            </button>
            <span>›</span>
            <span>Study</span>
            </nav>
        </header>

        <main className={styles.main}>

            {finished ? (
            /* Session complete — show summary */
            <div className={styles.summary}>
                <h2>Session complete</h2>
                <p className={styles.topicName}>{topic?.name}</p>

                <div className={styles.scoreRow}>
                <div className={styles.scoreCard}>
                    <span className={styles.scoreNumber}>{correct}</span>
                    <span className={styles.scoreLabel}>Correct</span>
                </div>
                <div className={styles.scoreCard}>
                    <span className={styles.scoreNumber}>{incorrect}</span>
                    <span className={styles.scoreLabel}>Incorrect</span>
                </div>
                <div className={styles.scoreCard}>
                    <span className={styles.scoreNumber}>
                    {Math.round((correct / cards.length) * 100)}%
                    </span>
                    <span className={styles.scoreLabel}>Score</span>
                </div>
                </div>

                <div className={styles.summaryActions}>
                <button className={styles.actionButton} onClick={handleRestart}>
                    Study again
                </button>
                <button className={styles.actionButton} onClick={handleShuffle}>
                    Shuffle & restart
                </button>
                <button
                    className={styles.actionButton}
                    onClick={() => router.push(`/topic/${id}`)}
                >
                    Back to topic
                </button>
                </div>
            </div>
            ) : (
            /* Active study session */
            <>
                <div className={styles.sessionHeader}>
                <h2 className={styles.topicName}>{topic?.name}</h2>

                {/* Progress counter and shuffle button */}
                <div className={styles.sessionMeta}>
                    <span className={styles.progress}>
                    {currentIndex + 1} / {cards.length}
                    </span>
                    <button
                    className={styles.shuffleButton}
                    onClick={handleShuffle}
                    >
                    Shuffle
                    </button>
                </div>
                </div>

                {/* Progress bar showing how far through the deck we are */}
                <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
                />
                </div>

                {/* The flashcard component */}
                <Flashcard
                front={currentCard.front}
                back={currentCard.back}
                onCorrect={handleCorrect}
                onIncorrect={handleIncorrect}
                />

                {/* Running tally of correct/incorrect so far */}
                <div className={styles.tally}>
                <span className={styles.tallyCorrect}>✓ {correct}</span>
                <span className={styles.tallyIncorrect}>✗ {incorrect}</span>
                </div>
            </>
            )}

        </main>
        </div>
    )
}