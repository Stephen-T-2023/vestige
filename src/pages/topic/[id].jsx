/* ============================================
    topic/[id].jsx
    Vestige — Ashborne
    Topic detail page — shows all flashcards belonging
    to a topic. Handles creating and deleting flashcards.
   ============================================ */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import supabase from '../../lib/supabaseClient'
import styles from '../../styles/Topic.module.css'

export default function TopicPage() {
    const router = useRouter()
    const { id } = router.query

    const [topic, setTopic] = useState(null)
    const [subject, setSubject] = useState(null)
    const [flashcards, setFlashcards] = useState([])
    const [front, setFront] = useState('')
    const [back, setBack] = useState('')
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState(null)

    const [note, setNote] = useState('')
    const [noteId, setNoteId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState(null)

    const [questions, setQuestions] = useState([])
    const [newQuestion, setNewQuestion] = useState('')
    const [newAnswer, setNewAnswer] = useState('')
    const [creatingQuestion, setCreatingQuestion] = useState(false)

    /* Fetch the topic and its parent subject for
        display and breadcrumb navigation */
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
        setSubject(data.subjects)
        }
    }

    /* Fetch all flashcards belonging to this topic */
    async function fetchFlashcards() {
        const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('topic_id', id)
        .order('created_at', { ascending: true })

        if (error) {
        setError(error.message)
        } else {
        setFlashcards(data)
        }
    }

    /* Fetch the note for this topic if one exists.
     Each topic has at most one note document. */
    async function fetchNote() {
        const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('topic_id', id)
        .single()

        if (data) {
        setNote(data.content)
        setNoteId(data.id)
        }
    }

    /* Fetch all practice questions for this topic */
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

    /* Debounce ref — stores the timeout between keystrokes
     so we only save once the user stops typing */
    const saveTimeout = useRef(null)

    /* Called every time the note content changes.
        Waits 1 second after the last keystroke then saves. */
    async function handleNoteChange(value) {
        setNote(value)
        setSaveStatus('typing...')

        /* Clear any existing timeout so the timer resets
        each time the user types another character */
        clearTimeout(saveTimeout.current)

        saveTimeout.current = setTimeout(async () => {
        setSaving(true)
        setSaveStatus('saving...')

        if (noteId) {
            /* Note already exists — update it */
            const { error } = await supabase
            .from('notes')
            .update({ content: value, updated_at: new Date().toISOString() })
            .eq('id', noteId)

            if (error) setSaveStatus('error saving')
            else setSaveStatus('saved')
        } else {
            /* No note yet — create one for this topic */
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

    useEffect(() => {
        if (!id) return

        async function init() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            router.push('/login')
        } else {
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

    /* Create a new flashcard under this topic */
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
        } else {
        setFlashcards([...flashcards, data[0]])
        setFront('')
        setBack('')
        }

        setCreating(false)
    }

    /* Delete a flashcard by its id */
    async function handleDeleteFlashcard(flashcardId) {
        const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId)

        if (error) {
        setError(error.message)
        } else {
        setFlashcards(flashcards.filter(f => f.id !== flashcardId))
        }
    }

    /* Create a new practice question under this topic */
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
        setError(error.message)
        } else {
        setQuestions([...questions, data[0]])
        setNewQuestion('')
        setNewAnswer('')
        }

        setCreatingQuestion(false)
    }

    /* Delete a question by its id */
    async function handleDeleteQuestion(questionId) {
        const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

        if (error) {
        setError(error.message)
        } else {
        setQuestions(questions.filter(q => q.id !== questionId))
        }
    }

    if (loading) return null

    return (
        <div className={styles.container}>
        <header className={styles.header}>
            <h1 className={styles.logo}>Vestige</h1>
            <div className={styles.headerRight}>
            {/* Breadcrumb — Dashboard > Subject > Topic */}
            <nav className={styles.breadcrumb}>
                <button onClick={() => router.push('/dashboard')}>Dashboard</button>
                <span>›</span>
                <button onClick={() => router.push(`/subject/${subject?.id}`)}>
                {subject?.name}
                </button>
                <span>›</span>
                <span>{topic?.name}</span>
            </nav>
            </div>
        </header>

        <main className={styles.main}>

            <div className={styles.pageHeader}>
            <h2>{topic?.name}</h2>
            <p>{flashcards.length} {flashcards.length === 1 ? 'card' : 'cards'}</p>
            </div>

            {/* Notes editor — auto saves as the user types */}
            <div className={styles.notesSection}>
            <div className={styles.notesSectionHeader}>
                <h3>Notes</h3>
                {/* Save status indicator */}
                {saveStatus && (
                <span className={styles.saveStatus}>{saveStatus}</span>
                )}
            </div>
            <textarea
                className={styles.notesEditor}
                placeholder="Write your notes for this topic here..."
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                rows={8}
            />
            </div>

            {/* Study mode button — only shown if there are cards to study */}
            {flashcards.length > 0 && (
            <button
                className={styles.studyButton}
                onClick={() => router.push(`/study/${id}`)}
            >
                Study this topic →
            </button>
            )}

            {/* Add flashcard form */}
            <form onSubmit={handleCreateFlashcard} className={styles.createForm}>
            <h3>Add a flashcard</h3>
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

            {/* Flashcards list */}
            {flashcards.length === 0 ? (
            <div className={styles.emptyState}>
                <p>No flashcards yet. Add one above to get started.</p>
            </div>
            ) : (
            <ul className={styles.flashcardList}>
                {/* Flashcards list — each card expands on click */}
                {flashcards.length === 0 ? (
                <div className={styles.emptyState}>
                    <p>No flashcards yet. Add one above to get started.</p>
                </div>
                ) : (
                <ul className={styles.flashcardList}>
                    {flashcards.map(card => (
                    <FlashcardRow
                        key={card.id}
                        card={card}
                        onDelete={handleDeleteFlashcard}
                    />
                    ))}
                </ul>
                )}
            </ul>
            )}

            {/* Practice questions section */}
            <div className={styles.questionsSection}>

            <div className={styles.questionsSectionHeader}>
                <h3>Practice Questions</h3>
                <span className={styles.questionCount}>
                {questions.length} {questions.length === 1 ? 'question' : 'questions'}
                </span>
            </div>

            {/* Add question form */}
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

            {/* Questions list */}
            {questions.length === 0 ? (
                <div className={styles.emptyState}>
                <p>No practice questions yet. Add one above.</p>
                </div>
            ) : (
                <ul className={styles.questionList}>
                {questions.map(q => (
                    <QuestionRow
                    key={q.id}
                    question={q}
                    onDelete={handleDeleteQuestion}
                    />
                ))}
                </ul>
            )}

            </div>

        </main>
        </div>
    )
}

/* ============================================
    FlashcardRow component
    Renders a single flashcard in the list as a
    collapsible row. Clicking the front reveals
    the back with an expand/collapse animation.
    Delete requires confirmation.
   ============================================ */
function FlashcardRow({ card, onDelete }) {
    const [expanded, setExpanded] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const backRef = useRef(null)

    function handleToggle() {
        const el = backRef.current
        if (!el) return

        if (!expanded) {
        /* Opening — animate from 0 to natural height */
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
        /* Closing — lock height first then animate to 0 */
        el.style.height = el.scrollHeight + 'px'
        el.getBoundingClientRect()
        el.style.transition = 'height 0.35s ease, opacity 0.35s ease'
        el.style.height = '0px'
        el.style.opacity = '0'
        setExpanded(false)
        }
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
        <button
        className={styles.flashcardToggle}
        onClick={handleToggle}
        >
            {/* Stacked label and front text */}
            <div className={styles.cardFrontWrapper}>
            <span className={styles.cardFrontLabel}>Front</span>
            <span className={styles.cardFront}>{card.front}</span>
            </div>
            <span className={styles.toggleIcon}>{expanded ? '▲' : '▼'}</span>
        </button>

        {/* Always mounted — hidden via height 0 when closed
            so we can animate in both directions cleanly */}
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
            <button className={styles.deleteButton} onClick={handleDeleteClick}>
                Delete
            </button>
            )}
        </div>
        </li>
    )
}

/* ============================================
    QuestionRow component
    Renders a single practice question. Answer
    is hidden by default and revealed on click.
    Delete requires confirmation.
   ============================================ */
function QuestionRow({ question, onDelete }) {
    const [revealed, setRevealed] = useState(false)
    const [confirming, setConfirming] = useState(false)
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

    function handleDeleteClick() {
        if (confirming) {
        onDelete(question.id)
        } else {
        setConfirming(true)
        }
    }

    return (
        <li className={styles.questionItem}>

        {/* Question row — click to reveal answer */}
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

        {/* Answer — always mounted, hidden via height 0 */}
        <div
            ref={answerRef}
            className={styles.answerPanel}
            style={{ height: 0, opacity: 0, overflow: 'hidden' }}
        >
            <span className={styles.sideLabel}>Answer</span>
            <p>{question.answer_text}</p>

            {/* Mark correct/incorrect after revealing */}
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

        {/* Delete with confirmation */}
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
            <button className={styles.deleteButton} onClick={handleDeleteClick}>
                Delete
            </button>
            )}
        </div>

        </li>
    )
}