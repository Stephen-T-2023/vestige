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
import Skeleton from '../components/Skeleton'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'
import { useBreadcrumb } from '../lib/BreadcrumbContext'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState([])
    const [newSubjectName, setNewSubjectName] = useState('')
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState(null)

    const { setCrumbs } = useBreadcrumb()

    /* Set breadcrumb trail for this page */
    useEffect(() => {
        setCrumbs([
        { label: 'Dashboard' }
        ])
    }, [setCrumbs])

    /* Fetch all subjects that belong to the current user */
    async function fetchSubjects(userId) {
        const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

        if (error) {
        /* If fetch fails try loading from cache */
        const cached = localStorage.getItem('vestige-subjects')
        if (cached) setSubjects(JSON.parse(cached))
        setError(error.message)
        } else {
        setSubjects(data)
        /* Save a fresh copy to localStorage */
        localStorage.setItem('vestige-subjects', JSON.stringify(data))
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

                /* Load cached data immediately so the page
                renders instantly while fresh data fetches */
                const cached = localStorage.getItem('vestige-subjects')
                if (cached) {
                setSubjects(JSON.parse(cached))
                setLoading(false)
                }

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
        toast.error('Failed to create subject')
        } else {
        setSubjects([...subjects, data[0]])
        setNewSubjectName('')
        toast.success('Subject created')
        }

        setCreating(false)
    }

    async function handleDeleteSubject(id) {
        const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)

        if (error) {
        setError(error.message)
        toast.error('Failed to delete subject')
        } else {
        setSubjects(subjects.filter(s => s.id !== id))
        toast.success('Subject deleted')
        }
    }

    async function handleEditSubject(id, newName) {
        const { error } = await supabase
        .from('subjects')
        .update({ name: newName })
        .eq('id', id)

        if (error) {
        setError(error.message)
        toast.error('Failed to update subject')
        } else {
        setSubjects(subjects.map(s =>
            s.id === id ? { ...s, name: newName } : s
        ))
        toast.success('Subject updated')
        }
    }

    /* Handle logout */
    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    if (loading) return (
        <div className={styles.main} style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <Skeleton height="1.5rem" width="160px" />
        <div style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
            <Skeleton height="0.875rem" width="240px" />
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
            <EmptyState
                message="No subjects yet"
                hint="Add a subject above to get started"
            />
            ) : (
            <ul className={styles.subjectList}>
                {subjects.map(subject => (
                <SubjectRow
                    key={subject.id}
                    subject={subject}
                    onDelete={handleDeleteSubject}
                    onEdit={handleEditSubject}
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
    SubjectRow component
    Handles inline editing and delete confirmation
    for a single subject row on the dashboard.
   ============================================ */
function SubjectRow({ subject, onDelete, onEdit, router }) {
    const [editing, setEditing] = useState(false)
    const [editValue, setEditValue] = useState(subject.name)
    const [confirming, setConfirming] = useState(false)

    /* Save the edited name on form submit */
    function handleEditSubmit(e) {
        e.preventDefault()
        if (!editValue.trim()) return
        onEdit(subject.id, editValue.trim())
        setEditing(false)
    }

    /* Cancel edit and reset value */
    function handleEditCancel() {
        setEditValue(subject.name)
        setEditing(false)
    }

    function handleDeleteClick() {
        if (confirming) {
        onDelete(subject.id)
        } else {
        setConfirming(true)
        }
    }

    return (
        <li className={styles.subjectItem}>
        {editing ? (
            /* Inline edit form replaces the subject name */
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
                className={styles.subjectName}
                onClick={() => router.push(`/subject/${subject.id}`)}
            >
                {subject.name}
            </button>

            <div className={styles.rowActions}>
                {confirming ? (
                <div className={styles.confirmRow}>
                    <span className={styles.confirmText}>Delete subject?</span>
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