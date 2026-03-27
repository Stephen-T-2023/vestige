/* ============================================
    SearchBar.jsx
    Vestige — Ashborne
    Global search component. Queries subjects,
    topics and flashcards by keyword and shows
    results grouped by type in a dropdown.
   ============================================ */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import styles from '../styles/SearchBar.module.css'

export default function SearchBar({ userId }) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState({ subjects: [], topics: [], flashcards: [] })
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const containerRef = useRef(null)
    const searchTimeout = useRef(null)

    /* Close the dropdown when clicking outside */
    useEffect(() => {
        function handleClickOutside(e) {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
            setOpen(false)
        }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    /* Debounced search — waits 400ms after last keystroke
        before firing queries to avoid hammering Supabase */
    function handleChange(e) {
        const value = e.target.value
        setQuery(value)

        if (!value.trim()) {
        setResults({ subjects: [], topics: [], flashcards: [] })
        setOpen(false)
        return
        }

        clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
        runSearch(value.trim())
        }, 400)
    }

    async function runSearch(term) {
        setLoading(true)

        /* Search subjects by name */
        const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', userId)
        .ilike('name', `%${term}%`)
        .limit(4)

        /* Search topics by name */
        const { data: topics } = await supabase
        .from('topics')
        .select('id, name, subjects(id, name)')
        .ilike('name', `%${term}%`)
        .limit(4)

        /* Search flashcards by front or back text */
        const { data: flashcards } = await supabase
        .from('flashcards')
        .select('id, front, back, topic_id')
        .or(`front.ilike.%${term}%,back.ilike.%${term}%`)
        .limit(4)

        setResults({
        subjects: subjects || [],
        topics: topics || [],
        flashcards: flashcards || [],
        })

        setOpen(true)
        setLoading(false)
    }

    /* Navigate to the relevant page and close dropdown */
    function handleResultClick(path) {
        setQuery('')
        setOpen(false)
        setResults({ subjects: [], topics: [], flashcards: [] })
        router.push(path)
    }

    const hasResults =
        results.subjects.length > 0 ||
        results.topics.length > 0 ||
        results.flashcards.length > 0

    return (
        <div className={styles.container} ref={containerRef}>
        <input
            type="text"
            className={styles.input}
            placeholder="Search subjects, topics, flashcards..."
            value={query}
            onChange={handleChange}
        />

        {/* Dropdown results */}
        {open && (
            <div className={styles.dropdown}>
            {loading && (
                <p className={styles.loadingText}>Searching...</p>
            )}

            {!loading && !hasResults && (
                <p className={styles.emptyText}>No results for {query}</p>
            )}

            {/* Subjects results group */}
            {results.subjects.length > 0 && (
                <div className={styles.group}>
                <span className={styles.groupLabel}>Subjects</span>
                {results.subjects.map(s => (
                    <button
                    key={s.id}
                    className={styles.result}
                    onClick={() => handleResultClick(`/subject/${s.id}`)}
                    >
                    {s.name}
                    </button>
                ))}
                </div>
            )}

            {/* Topics results group */}
            {results.topics.length > 0 && (
                <div className={styles.group}>
                <span className={styles.groupLabel}>Topics</span>
                {results.topics.map(t => (
                    <button
                    key={t.id}
                    className={styles.result}
                    onClick={() => handleResultClick(`/topic/${t.id}`)}
                    >
                    <span>{t.name}</span>
                    <span className={styles.resultMeta}>{t.subjects?.name}</span>
                    </button>
                ))}
                </div>
            )}

            {/* Flashcards results group */}
            {results.flashcards.length > 0 && (
                <div className={styles.group}>
                <span className={styles.groupLabel}>Flashcards</span>
                {results.flashcards.map(f => (
                    <button
                    key={f.id}
                    className={styles.result}
                    onClick={() => handleResultClick(`/topic/${f.topic_id}`)}
                    >
                    <span>{f.front}</span>
                    <span className={styles.resultMeta}>{f.back}</span>
                    </button>
                ))}
                </div>
            )}

            </div>
        )}
        </div>
    )
}