/* ============================================
   dashboard.jsx
   Vestige — Ashborne
   Main dashboard — shows all subjects belonging
   to the logged in user. Handles creating and
   deleting subjects. Protected route.
   ============================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import styles from '../styles/Dashboard.module.css'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState([])
    const [newSubjectName, setNewSubjectName] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState(null)

    /* Fetch all subjects that belong to the current user */
    async function fetchSubjects(userId) {
        const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

        if (error) {
        setError(error.message)
        } else {
        setSubjects(data)
        }
    }

    useEffect(() => {
        /* Check session then load subjects once
        we confirm the user is authenticated */
        async function init() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
        } else {
            setUser(session.user)
            await fetchSubjects(session.user.id)
            setLoading(false)
        }
    }

        init()
    }, [router])

    /* Create a new subject and add it to the list */
    async function handleCreateSubject(e) {
        e.preventDefault()
        if (!newSubjectName.trim()) return
        setCreating(true)

        const { data, error } = await supabase
        .from('subjects')
        .insert([{ name: newSubjectName.trim(), user_id: user.id }])
        .select()

        if (error) {
        setError(error.message)
        } else {
        /* Add the new subject to state so the UI updates
            instantly without needing a full refetch */
        setSubjects([...subjects, data[0]])
        setNewSubjectName('')
        }

        setCreating(false)
    }

    /* Delete a subject by its id */
    async function handleDeleteSubject(id) {
        const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)

        if (error) {
        setError(error.message)
        } else {
        /* Remove the deleted subject from state */
        setSubjects(subjects.filter(s => s.id !== id))
        }
    }

    /* Handle logout */
    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) return null

    return (
        <div className={styles.container}>
        <header className={styles.header}>
            <h1 className={styles.logo}>Vestige</h1>
            <div className={styles.headerRight}>
            <span className={styles.email}>{user.email}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
                Sign out
            </button>
            </div>
        </header>

        <main className={styles.main}>

            <div className={styles.pageHeader}>
            <h2>Your Subjects</h2>
            <p>Select a subject to view its topics.</p>
            </div>

            {/* Create new subject form */}
            <form onSubmit={handleCreateSubject} className={styles.createForm}>
            <input
                type="text"
                placeholder="New subject name..."
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className={styles.createInput}
            />
            <button
                type="submit"
                disabled={creating}
                className={styles.createButton}
            >
                {creating ? 'Adding...' : 'Add Subject'}
            </button>
            </form>

            {error && <p className={styles.error}>{error}</p>}

            {/* Subjects list */}
            {subjects.length === 0 ? (
            /* Empty state — shown when user has no subjects yet */
            <div className={styles.emptyState}>
                <p>No subjects yet. Add one above to get started.</p>
            </div>
            ) : (
            <ul className={styles.subjectList}>
                {subjects.map(subject => (
                <li key={subject.id} className={styles.subjectItem}>
                    <button
                    className={styles.subjectName}
                    onClick={() => router.push(`/subject/${subject.id}`)}
                    >
                    {subject.name}
                    </button>
                    <button
                    className={styles.deleteButton}
                    onClick={() => handleDeleteSubject(subject.id)}
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