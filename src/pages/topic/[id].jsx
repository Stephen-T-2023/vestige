/* ============================================
    topic/[id].jsx
    Vestige — Ashborne
    Topic detail page — sidebar layout with four
    sections: Notes, Flashcards, Questions, Study.
    All data is fetched on mount and sections are
    switched via the sidebar without page navigation.
   ============================================ */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'
import EmptyState from '../../components/EmptyState'
import { useBreadcrumb } from '../../lib/BreadcrumbContext'
import styles from '../../styles/Topic.module.css'
import toast from 'react-hot-toast'

export default function TopicPage() {
    const router = useRouter()
    const { id } = router.query
    const { setCrumbs } = useBreadcrumb()

    const [topic, setTopic] = useState(null)
    const [flashcards, setFlashcards] = useState([])
    const [note, setNote] = useState('')
    const [noteId, setNoteId] = useState(null)
    const [questions, setQuestions] = useState([])
    const [front, setFront] = useState('')
    const [back, setBack] = useState('')
    const [newQuestion, setNewQuestion] = useState('')
    const [newAnswer, setNewAnswer] = useState('')
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [creatingQuestion, setCreatingQuestion] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState(null)
    const [error, setError] = useState(null)
    const [activeSection, setActiveSection] = useState('notes')
    const saveTimeout = useRef(null)

    /* Update breadcrumb when topic loads */
    useEffect(() => {
        if (!topic) return
        setCrumbs([
        { label: 'Dashboard', href: '/dashboard' },
        { label: topic.subjects?.name, href: `/subject/${topic.subjects?.id}` },
        { label: topic.name }
        ])
    }, [topic, setCrumbs])

    async function fetchTopic() {
        const { data, error } = await supabase
        .from('topics')
        .select('*, subjects(id, name)')
        .eq('id', id)
        .single()

        if (error) {
        setError(error.message)
        } else {
        setTopic(data)
        }
    }

    async function fetchFlashcards() {
        const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true })

        if (error) {
        const cached = localStorage.getItem(`vestige-flashcards-${id}`)
        if (cached) setFlashcards(JSON.parse(cached))
        } else {
        setFlashcards(data)
        localStorage.setItem(`vestige-flashcards-${id}`, JSON.stringify(data))
        }
    }

    async function fetchNote() {
        const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('topic_id', id)
        .single()

        if (data) {
        setNote(data.content)
        setNoteId(data.id)
        }
    }

    async function fetchQuestions() {
        const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true })

        if (error) {
        setError(error.message)
        } else {
        setQuestions(data)
        }
    }

    useEffect(() => {
        if (!id) return

        async function init() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
        } else {
            const cached = localStorage.getItem(`vestige-flashcards-${id}`)
            if (cached) {
            setFlashcards(JSON.parse(cached))
            setLoading(false)
            }

            await fetchTopic()
            await fetchFlashcards()
            await fetchNote()
            await fetchQuestions()
            setLoading(false)
        }
        }

        init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, router])

    /* Auto save notes with 1 second debounce */
    async function handleNoteChange(value) {
        setNote(value)
        setSaveStatus('typing...')
        clearTimeout(saveTimeout.current)

        saveTimeout.current = setTimeout(async () => {
        setSaving(true)
        setSaveStatus('saving...')

        if (noteId) {
            const { error } = await supabase
            .from('notes')
            .update({ content: value, updated_at: new Date().toISOString() })
            .eq('id', noteId)

            if (error) setSaveStatus('error saving')
            else setSaveStatus('saved')
        } else {
            const { data, error } = await supabase
            .from('notes')
            .insert([{ topic_id: id, content: value }])
            .select()
            .single()

            if (error) setSaveStatus('error saving')
            else {
            setNoteId(data.id)
            setSaveStatus('saved')
            }
        }

        setSaving(false)
        }, 1000)
    }

    async function handleCreateFlashcard(e) {
        e.preventDefault()
        if (!front.trim() || !back.trim()) return
        setCreating(true)

        const { data, error } = await supabase
        .from('flashcards')
        .insert([{ front: front.trim(), back: back.trim(), topic_id: id }])
        .select()

        if (error) {
        setError(error.message)
        toast.error('Failed to create flashcard')
        } else {
        setFlashcards([...flashcards, data[0]])
        setFront('')
        setBack('')
        toast.success('Flashcard created')
        }

        setCreating(false)
    }

    async function handleDeleteFlashcard(flashcardId) {
        const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)

        if (error) {
        toast.error('Failed to delete flashcard')
        } else {
        setFlashcards(flashcards.filter(f => f.id !== flashcardId))
        toast.success('Flashcard deleted')
        }
    }

    async function handleEditFlashcard(id, newFront, newBack) {
        const { error } = await supabase
        .from('flashcards')
        .update({ front: newFront, back: newBack })
        .eq('id', id)

        if (error) {
        toast.error('Failed to update flashcard')
        } else {
        setFlashcards(flashcards.map(f =>
            f.id === id ? { ...f, front: newFront, back: newBack } : f
        ))
        toast.success('Flashcard updated')
        }
    }

    async function handleCreateQuestion(e) {
        e.preventDefault()
        if (!newQuestion.trim() || !newAnswer.trim()) return
        setCreatingQuestion(true)

        const { data, error } = await supabase
        .from('questions')
        .insert([{
            question_text: newQuestion.trim(),
            answer_text: newAnswer.trim(),
            topic_id: id
        }])
        .select()

        if (error) {
        toast.error('Failed to create question')
        } else {
        setQuestions([...questions, data[0]])
        setNewQuestion('')
        setNewAnswer('')
        toast.success('Question created')
        }

        setCreatingQuestion(false)
    }

    async function handleDeleteQuestion(questionId) {
        const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

        if (error) {
        toast.error('Failed to delete question')
        } else {
        setQuestions(questions.filter(q => q.id !== questionId))
        toast.success('Question deleted')
        }
    }

    async function handleEditQuestion(id, newQuestion, newAnswer) {
        const { error } = await supabase
        .from('questions')
        .update({ question_text: newQuestion, answer_text: newAnswer })
        .eq('id', id)

        if (error) {
        toast.error('Failed to update question')
        } else {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, question_text: newQuestion, answer_text: newAnswer } : q
        ))
        toast.success('Question updated')
        }
    }

    if (loading) return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2.5rem 2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
            <div style={{ height: '1.5rem', width: '180px', background: 'var(--colour-bg-secondary)', borderRadius: '4px' }} />
        </div>
        </div>
    )

    return (
        <div className={styles.layout}>

        {/* Sidebar navigation */}
        <aside className={styles.sidebar}>
            <div className={styles.sidebarTopic}>
            <span className={styles.sidebarTopicLabel}>Topic</span>
            <span className={styles.sidebarTopicName}>{topic?.name}</span>
            </div>

            <nav className={styles.sidebarNav}>
            {/* Notes section link */}
            <button
                className={`${styles.sidebarLink} ${activeSection === 'notes' ? styles.sidebarLinkActive : ''}`}
                onClick={() => setActiveSection('notes')}
            >
                <span>Notes</span>
                {saveStatus === 'saved' && activeSection === 'notes' && (
                <span className={styles.savedDot} />
                )}
            </button>

            {/* Flashcards section link */}
            <button
                className={`${styles.sidebarLink} ${activeSection === 'flashcards' ? styles.sidebarLinkActive : ''}`}
                onClick={() => setActiveSection('flashcards')}
            >
                <span>Flashcards</span>
                <span className={styles.sidebarCount}>{flashcards.length}</span>
            </button>

            {/* Questions section link */}
            <button
                className={`${styles.sidebarLink} ${activeSection === 'questions' ? styles.sidebarLinkActive : ''}`}
                onClick={() => setActiveSection('questions')}
            >
                <span>Questions</span>
                <span className={styles.sidebarCount}>{questions.length}</span>
            </button>

            {/* Study — navigates to study page */}
            <button
                className={`${styles.sidebarLink} ${styles.sidebarStudyLink} ${flashcards.length === 0 ? styles.sidebarLinkDisabled : ''}`}
                onClick={() => flashcards.length > 0 && router.push(`/study/${id}`)}
                title={flashcards.length === 0 ? 'Add flashcards to study' : ''}
            >
                <span>Study →</span>
                {flashcards.length > 0 && (
                <span className={styles.sidebarCount}>{flashcards.length} cards</span>
                )}
            </button>
            </nav>
        </aside>

        {/* Main content area */}
        <main className={styles.main}>

            {/* Notes section */}
            {activeSection === 'notes' && (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                <h2>Notes</h2>
                {saveStatus && (
                    <span className={styles.saveStatus}>{saveStatus}</span>
                )}
                </div>
                <textarea
                className={styles.notesEditor}
                placeholder="Write your notes for this topic here..."
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                rows={16}
                />
            </div>
            )}

            {/* Flashcards section */}
            {activeSection === 'flashcards' && (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                <h2>Flashcards</h2>
                <span className={styles.sectionCount}>
                    {flashcards.length} {flashcards.length === 1 ? 'card' : 'cards'}
                </span>
                </div>

                <form onSubmit={handleCreateFlashcard} className={styles.createForm}>
                <div className={styles.cardInputs}>
                    <div className={styles.field}>
                    <label htmlFor="front">Front</label>
                    <textarea
                        id="front"
                        placeholder="Question or term..."
                        value={front}
                        onChange={(e) => setFront(e.target.value)}
                        rows={3}
                        required
                    />
                    </div>
                    <div className={styles.field}>
                    <label htmlFor="back">Back</label>
                    <textarea
                        id="back"
                        placeholder="Answer or definition..."
                        value={back}
                        onChange={(e) => setBack(e.target.value)}
                        rows={3}
                        required
                    />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={creating}
                    className={styles.createButton}
                >
                    {creating ? 'Adding...' : 'Add Flashcard'}
                </button>
                </form>

                {error && <p className={styles.error}>{error}</p>}

                {flashcards.length === 0 ? (
                <EmptyState
                    message="No flashcards yet"
                    hint="Add a flashcard above to get started"
                />
                ) : (
                <ul className={styles.flashcardList}>
                    {flashcards.map(card => (
                    <FlashcardRow
                        key={card.id}
                        card={card}
                        onDelete={handleDeleteFlashcard}
                        onEdit={handleEditFlashcard}
                    />
                    ))}
                </ul>
                )}
            </div>
            )}

            {/* Questions section */}
            {activeSection === 'questions' && (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                <h2>Practice Questions</h2>
                <span className={styles.sectionCount}>
                    {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                </span>
                </div>

                <form onSubmit={handleCreateQuestion} className={styles.createForm}>
                <div className={styles.cardInputs}>
                    <div className={styles.field}>
                    <label htmlFor="question">Question</label>
                    <textarea
                        id="question"
                        placeholder="Write your question here..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        rows={3}
                        required
                    />
                    </div>
                    <div className={styles.field}>
                    <label htmlFor="answer">Answer</label>
                    <textarea
                        id="answer"
                        placeholder="Write the answer here..."
                        value={newAnswer}
                        onChange={(e) => setNewAnswer(e.target.value)}
                        rows={3}
                        required
                    />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={creatingQuestion}
                    className={styles.createButton}
                >
                    {creatingQuestion ? 'Adding...' : 'Add Question'}
                </button>
                </form>

                {questions.length === 0 ? (
                <EmptyState
                    message="No practice questions yet"
                    hint="Add a question above to get started"
                />
                ) : (
                <ul className={styles.questionList}>
                    {questions.map(q => (
                    <QuestionRow
                        key={q.id}
                        question={q}
                        onDelete={handleDeleteQuestion}
                        onEdit={handleEditQuestion}
                    />
                    ))}
                </ul>
                )}
            </div>
            )}

        </main>
        </div>
    )
}

/* ============================================
    FlashcardRow component
    Renders a single flashcard in the list as a
    collapsible row. Supports inline editing of
    front and back. Delete requires confirmation.
   ============================================ */
function FlashcardRow({ card, onDelete, onEdit }) {
    const [expanded, setExpanded] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editFront, setEditFront] = useState(card.front)
    const [editBack, setEditBack] = useState(card.back)
    const backRef = useRef(null)

    function handleToggle() {
        const el = backRef.current
        if (!el) return

        if (!expanded) {
        el.style.transition = 'none'
        el.style.height = '0px'
        el.style.opacity = '0'
        el.getBoundingClientRect()
        el.style.transition = 'height 0.35s ease, opacity 0.35s ease'
        el.style.height = el.scrollHeight + 'px'
        el.style.opacity = '1'
        setTimeout(() => {
            if (backRef.current) backRef.current.style.height = 'auto'
        }, 350)
        setExpanded(true)
        } else {
        el.style.height = el.scrollHeight + 'px'
        el.getBoundingClientRect()
        el.style.transition = 'height 0.35s ease, opacity 0.35s ease'
        el.style.height = '0px'
        el.style.opacity = '0'
        setExpanded(false)
        }
    }

    function handleEditSubmit(e) {
        e.preventDefault()
        if (!editFront.trim() || !editBack.trim()) return
        onEdit(card.id, editFront.trim(), editBack.trim())
        setEditing(false)
    }

    function handleEditCancel() {
        setEditFront(card.front)
        setEditBack(card.back)
        setEditing(false)
    }

    function handleDeleteClick() {
        if (confirming) {
        onDelete(card.id)
        } else {
        setConfirming(true)
        }
    }

    return (
        <li className={styles.flashcardItem}>
        {editing ? (
            /* Inline edit form for front and back */
            <form onSubmit={handleEditSubmit} className={styles.flashcardEditForm}>
            <div className={styles.cardInputs}>
                <div className={styles.field}>
                <label>Front</label>
                <textarea
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    rows={3}
                    autoFocus
                />
                </div>
                <div className={styles.field}>
                <label>Back</label>
                <textarea
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    rows={3}
                />
                </div>
            </div>
            <div className={styles.editFormActions}>
                <button type="submit" className={styles.saveButton}>Save</button>
                <button
                type="button"
                className={styles.cancelButton}
                onClick={handleEditCancel}
                >
                Cancel
                </button>
            </div>
            </form>
        ) : (
            <>
            <button
                className={styles.flashcardToggle}
                onClick={handleToggle}
            >
                <div className={styles.cardFrontWrapper}>
                <span className={styles.cardFrontLabel}>Front</span>
                <span className={styles.cardFront}>{card.front}</span>
                </div>
                <span className={styles.toggleIcon}>{expanded ? '▲' : '▼'}</span>
            </button>

            <div
                ref={backRef}
                className={styles.cardBack}
                style={{ height: 0, opacity: 0, overflow: 'hidden' }}
            >
                <span className={styles.sideLabel}>Back</span>
                <p>{card.back}</p>
            </div>

            <div className={styles.cardActions}>
                {confirming ? (
                <>
                    <span className={styles.confirmText}>Delete this card?</span>
                    <button className={styles.confirmButton} onClick={handleDeleteClick}>
                    Yes, delete
                    </button>
                    <button
                    className={styles.cancelButton}
                    onClick={() => setConfirming(false)}
                    >
                    Cancel
                    </button>
                </>
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

/* ============================================
    QuestionRow component
    Renders a single practice question. Answer
    is hidden by default and revealed on click.
    Supports inline editing. Delete requires confirmation.
   ============================================ */
function QuestionRow({ question, onDelete, onEdit }) {
    const [revealed, setRevealed] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editQuestion, setEditQuestion] = useState(question.question_text)
    const [editAnswer, setEditAnswer] = useState(question.answer_text)
    const answerRef = useRef(null)

    function handleReveal() {
        const el = answerRef.current
        if (!el) return

        if (!revealed) {
        el.style.transition = 'none'
        el.style.height = '0px'
        el.style.opacity = '0'
        el.getBoundingClientRect()
        el.style.transition = 'height 0.35s ease, opacity 0.35s ease'
        el.style.height = el.scrollHeight + 'px'
        el.style.opacity = '1'
        setTimeout(() => {
            if (answerRef.current) answerRef.current.style.height = 'auto'
        }, 350)
        setRevealed(true)
        } else {
        el.style.height = el.scrollHeight + 'px'
        el.getBoundingClientRect()
        el.style.transition = 'height 0.35s ease, opacity 0.35s ease'
        el.style.height = '0px'
        el.style.opacity = '0'
        setRevealed(false)
        }
    }

    function handleEditSubmit(e) {
        e.preventDefault()
        if (!editQuestion.trim() || !editAnswer.trim()) return
        onEdit(question.id, editQuestion.trim(), editAnswer.trim())
        setEditing(false)
    }

    function handleEditCancel() {
        setEditQuestion(question.question_text)
        setEditAnswer(question.answer_text)
        setEditing(false)
    }

    function handleDeleteClick() {
        if (confirming) {
        onDelete(question.id)
        } else {
        setConfirming(true)
        }
    }

    return (
        <li className={styles.questionItem}>
        {editing ? (
            /* Inline edit form for question and answer */
            <form onSubmit={handleEditSubmit} className={styles.flashcardEditForm}>
            <div className={styles.cardInputs}>
                <div className={styles.field}>
                <label>Question</label>
                <textarea
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    rows={3}
                    autoFocus
                />
                </div>
                <div className={styles.field}>
                <label>Answer</label>
                <textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    rows={3}
                />
                </div>
            </div>
            <div className={styles.editFormActions}>
                <button type="submit" className={styles.saveButton}>Save</button>
                <button
                type="button"
                className={styles.cancelButton}
                onClick={handleEditCancel}
                >
                Cancel
                </button>
            </div>
            </form>
        ) : (
            <>
            <button
                className={styles.questionToggle}
                onClick={handleReveal}
            >
                <div className={styles.questionTextWrapper}>
                <span className={styles.questionLabel}>Question</span>
                <span className={styles.questionText}>{question.question_text}</span>
                </div>
                <span className={styles.toggleIcon}>{revealed ? '▲' : '▼'}</span>
            </button>

            <div
                ref={answerRef}
                className={styles.answerPanel}
                style={{ height: 0, opacity: 0, overflow: 'hidden' }}
            >
                <span className={styles.sideLabel}>Answer</span>
                <p>{question.answer_text}</p>

                <div className={styles.markRow}>
                <button
                    className={styles.incorrectMark}
                    onClick={() => setRevealed(false)}
                >
                    ✗ Incorrect
                </button>
                <button
                    className={styles.correctMark}
                    onClick={() => setRevealed(false)}
                >
                    ✓ Correct
                </button>
                </div>
            </div>

            <div className={styles.cardActions}>
                {confirming ? (
                <>
                    <span className={styles.confirmText}>Delete this question?</span>
                    <button className={styles.confirmButton} onClick={handleDeleteClick}>
                    Yes, delete
                    </button>
                    <button
                    className={styles.cancelButton}
                    onClick={() => setConfirming(false)}
                    >
                    Cancel
                    </button>
                </>
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