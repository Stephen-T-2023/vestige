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
import Skeleton from '../../components/Skeleton'
import toast from 'react-hot-toast'
import EmptyState from '../../components/EmptyState'
import { useBreadcrumb } from '../../lib/BreadcrumbContext'

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

    const { setCrumbs } = useBreadcrumb()

    /* Update breadcrumb when subject name loads */
    useEffect(() => {
        if (!subject) return
        setCrumbs([
        { label: 'Dashboard', href: '/dashboard' },
        { label: subject.name }
        ])
    }, [subject, setCrumbs])

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
        const cached = localStorage.getItem(`vestige-topics-${id}`)
        if (cached) setTopics(JSON.parse(cached))
        setError(error.message)
        } else {
        setTopics(data)
        localStorage.setItem(`vestige-topics-${id}`, JSON.stringify(data))
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

                const cached = localStorage.getItem(`vestige-topics-${id}`)
                if (cached) {
                setTopics(JSON.parse(cached))
                setLoading(false)
                }

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
        toast.error('Failed to create topic')
        } else {
        setTopics([...topics, data[0]])
        setNewTopicName('')
        toast.success('Topic created')
        }

        setCreating(false)
    }

    async function handleDeleteTopic(topicId) {
        const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', topicId)

        if (error) {
        setError(error.message)
        toast.error('Failed to delete topic')
        } else {
        setTopics(topics.filter(t => t.id !== topicId))
        toast.success('Topic deleted')
        }
    }

    async function handleEditTopic(id, newName) {
        const { error } = await supabase
        .from('topics')
        .update({ name: newName })
        .eq('id', id)

        if (error) {
        setError(error.message)
        toast.error('Failed to update topic')
        } else {
        setTopics(topics.map(t =>
            t.id === id ? { ...t, name: newName } : t
        ))
        toast.success('Topic updated')
        }
    }

    if (loading) return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <Skeleton height="1.5rem" width="200px" />
        <div style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
            <Skeleton height="0.875rem" width="280px" />
        </div>
        <Skeleton height="2.5rem" style={{ marginBottom: '2rem' }} />
        {[1,2,3].map(i => (
            <div key={i} style={{ marginBottom: '0.75rem' }}>
            <Skeleton height="3.5rem" />
            </div>
        ))}
        </div>
    )

    return (
        <div className={styles.container}>

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
            <EmptyState
                message="No topics yet"
                hint="Add a topic above to get started"
            />
            ) : (
            <ul className={styles.topicList}>
                {topics.map(topic => (
                <TopicRow
                    key={topic.id}
                    topic={topic}
                    onDelete={handleDeleteTopic}
                    onEdit={handleEditTopic}
                    router={router}
                />
                ))}
            </ul>
            )}

        </main>
        </div>
    )
}

/* ============================================
    TopicRow component
    Handles inline editing and delete confirmation
    for a single topic row on the subject page.
   ============================================ */
function TopicRow({ topic, onDelete, onEdit, router }) {
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState(topic.name)
    const [confirming, setConfirming] = useState(false)

    function handleEditSubmit(e) {
        e.preventDefault()
        if (!editValue.trim()) return
        onEdit(topic.id, editValue.trim())
        setEditing(false)
    }

    function handleEditCancel() {
        setEditValue(topic.name)
        setEditing(false)
    }

    function handleDeleteClick() {
        if (confirming) {
        onDelete(topic.id)
        } else {
        setConfirming(true)
        }
    }

    return (
        <li className={styles.topicItem}>
        {editing ? (
            /* Inline edit form replaces the topic name */
            <form onSubmit={handleEditSubmit} className={styles.inlineEditForm}>
            <input
                className={styles.inlineEditInput}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
            />
            <button type="submit" className={styles.saveButton}>Save</button>
            <button
                type="button"
                className={styles.cancelButton}
                onClick={handleEditCancel}
            >
                Cancel
            </button>
            </form>
        ) : (
            <>
            <button
                className={styles.topicName}
                onClick={() => router.push(`/topic/${topic.id}`)}
            >
                {topic.name}
            </button>

            <div className={styles.rowActions}>
                {confirming ? (
                <div className={styles.confirmRow}>
                    <span className={styles.confirmText}>Delete topic?</span>
                    <button className={styles.confirmButton} onClick={handleDeleteClick}>
                    Yes
                    </button>
                    <button
                    className={styles.cancelButton}
                    onClick={() => setConfirming(false)}
                    >
                    Cancel
                    </button>
                </div>
                ) : (
                <>
                    <button
                    className={styles.editButton}
                    onClick={() => setEditing(true)}
                    >
                    Edit
                    </button>
                    <button
                    className={styles.deleteButton}
                    onClick={handleDeleteClick}
                    >
                    Delete
                    </button>
                </>
                )}
            </div>
            </>
        )}
        </li>
    )
}