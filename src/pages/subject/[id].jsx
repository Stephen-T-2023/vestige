/* ============================================
    subject/[id].jsx
    Vestige — Ashborne
    Subject detail page — shows all topics belonging
    to a subject. Handles creating and deleting topics.
    The [id] in the filename means Next.js will match
    any route like /subject/some-uuid to this page.
   ============================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'
import styles from '../../styles/Subject.module.css'

export default function SubjectPage() {
    const router = useRouter()

    /* router.query.id is the subject UUID from the URL */
    const { id } = router.query

    const [user, setUser] = useState(null)
    const [subject, setSubject] = useState(null)
    const [topics, setTopics] = useState([])
    const [newTopicName, setNewTopicName] = useState('')
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState(null)

    /* Fetch the subject name so we can display it as the page title */
    async function fetchSubject(userId) {
        const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

        if (error) {
        setError(error.message)
        } else {
        setSubject(data)
        }
    }

    /* Fetch all topics belonging to this subject */
    async function fetchTopics() {
        const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: true })

        if (error) {
        setError(error.message)
        } else {
        setTopics(data)
        }
    }

    useEffect(() => {
        /* Wait for the router to be ready before reading
        the id from the URL — it can be undefined on first render */
        if (!id) return

        async function init() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
        } else {
            setUser(session.user)
            await fetchSubject(session.user.id)
            await fetchTopics()
            setLoading(false)
        }
        }

        init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, router])

    /* Create a new topic under this subject */
    async function handleCreateTopic(e) {
        e.preventDefault()
        if (!newTopicName.trim()) return
        setCreating(true)

        const { data, error } = await supabase
        .from('topics')
        .insert([{ name: newTopicName.trim(), subject_id: id }])
        .select()

        if (error) {
        setError(error.message)
        } else {
        setTopics([...topics, data[0]])
        setNewTopicName('')
        }

        setCreating(false)
    }

    /* Delete a topic by its id */
    async function handleDeleteTopic(topicId) {
        const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)

        if (error) {
        setError(error.message)
        } else {
        setTopics(topics.filter(t => t.id !== topicId))
        }
    }

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
            {/* Display the subject name as the page title */}
            <h2>{subject?.name}</h2>
            <p>Select a topic to view its flashcards and notes.</p>
            </div>

            {/* Create new topic form */}
            <form onSubmit={handleCreateTopic} className={styles.createForm}>
            <input
                type="text"
                placeholder="New topic name..."
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className={styles.createInput}
            />
            <button
                type="submit"
                disabled={creating}
                className={styles.createButton}
            >
                {creating ? 'Adding...' : 'Add Topic'}
            </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            {/* Topics list */}
            {topics.length === 0 ? (
            <div className={styles.emptyState}>
                <p>No topics yet. Add one above to get started.</p>
            </div>
            ) : (
            <ul className={styles.topicList}>
                {topics.map(topic => (
                <li key={topic.id} className={styles.topicItem}>
                    <button
                    className={styles.topicName}
                    onClick={() => router.push(`/topic/${topic.id}`)}
                    >
                    {topic.name}
                    </button>
                    <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteTopic(topic.id)}
                    >
                    Delete
                    </button>
                </li>
                ))}
            </ul>
            )}

        </main>
        </div>
    )
}