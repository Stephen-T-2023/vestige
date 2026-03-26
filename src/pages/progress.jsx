/* ============================================
    progress.jsx
    Vestige — Ashborne
    Progress dashboard — shows the user their
    study session history and score per topic.
    Highlights weak topics below 60%.
   ============================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import styles from '../styles/Progress.module.css'

export default function Progress() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [topicStats, setTopicStats] = useState([])
    const [loading, setLoading] = useState(true)

    /* Fetch all study sessions for the current user,
        grouped and calculated per topic */
    async function fetchProgress(userId) {
        const { data, error } = await supabase
        .from('study_sessions')
        .select('*, topics(name, subjects(name))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

        if (error) return

        /* Group sessions by topic and calculate
        cumulative correct/incorrect totals */
        const topicMap = {}

        data.forEach(session => {
        const topicId = session.topic_id
        const topicName = session.topics?.name
        const subjectName = session.topics?.subjects?.name

        if (!topicMap[topicId]) {
            topicMap[topicId] = {
            topicId,
            topicName,
            subjectName,
            correct: 0,
            incorrect: 0,
            sessions: 0,
            }
        }

        topicMap[topicId].correct += session.correct
        topicMap[topicId].incorrect += session.incorrect
        topicMap[topicId].sessions += 1
        })

        /* Convert the map to an array and calculate
        percentage score for each topic */
        const stats = Object.values(topicMap).map(t => ({
        ...t,
        total: t.correct + t.incorrect,
        percentage: t.correct + t.incorrect === 0
            ? 0
            : Math.round((t.correct / (t.correct + t.incorrect)) * 100)
        }))

        /* Sort by percentage ascending so weak topics appear first */
        stats.sort((a, b) => a.percentage - b.percentage)

        setTopicStats(stats)
    }

    useEffect(() => {
        async function init() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
        } else {
            setUser(session.user)
            await fetchProgress(session.user.id)
            setLoading(false)
        }
        }

        init()
    }, [router])

    if (loading) return null

    return (
        <div className={styles.container}>
        <header className={styles.header}>
            <h1 className={styles.logo}>Vestige</h1>
            <button
            className={styles.backButton}
            onClick={() => router.push('/dashboard')}
            >
            ← Dashboard
            </button>
        </header>

        <main className={styles.main}>

            <div className={styles.pageHeader}>
            <h2>Progress</h2>
            <p>Your cumulative scores across all study sessions.</p>
            </div>

            {topicStats.length === 0 ? (
            <div className={styles.emptyState}>
                <p>No study sessions yet. Complete a session to see your progress.</p>
            </div>
            ) : (
            <ul className={styles.statsList}>
                {topicStats.map(t => (
                <li
                    key={t.topicId}
                    className={`${styles.statItem} ${t.percentage < 60 ? styles.weak : ''}`}
                >
                    <div className={styles.topicInfo}>
                    {/* Subject name as breadcrumb above topic name */}
                    <div className={styles.topicInfo}>
                    <span className={styles.subjectName}>{t.subjectName}</span>
                    <span className={styles.topicName}>{t.topicName}</span>
                    <button
                        className={styles.goToTopic}
                        onClick={() => router.push(`/topic/${t.topicId}`)}
                    >
                        Go to topic →
                    </button>
                    </div>
                    </div>

                    <div className={styles.statRight}>
                    <div className={styles.barWrap}>
                        {/* Progress bar width driven by percentage score */}
                        <div
                        className={styles.barFill}
                        style={{ width: `${t.percentage}%` }}
                        />
                    </div>
                    <span className={styles.percentage}>{t.percentage}%</span>
                    <span className={styles.sessionCount}>
                        {t.sessions} {t.sessions === 1 ? 'session' : 'sessions'}
                    </span>
                    </div>

                    {/* Weak topic warning */}
                    {t.percentage < 60 && (
                    <span className={styles.weakBadge}>Needs work</span>
                    )}

                </li>
                ))}
            </ul>
            )}

        </main>
        </div>
    )
}