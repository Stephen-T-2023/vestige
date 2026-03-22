/* ============================================
    login.jsx
    Vestige — Ashborne
    Login page — handles existing user authentication
    via Supabase. Redirects to dashboard on success.
   ============================================ */

import { useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import styles from '../styles/Auth.module.css'

export default function Login() {
    /* router lets us redirect the user after login */
    const router = useRouter()

    /* Store form field values and any error messages in state */
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    /* Called when the form is submitted */
    async function handleLogin(e) {
        /* Prevent the browser's default form submission behaviour */
        e.preventDefault()
        setLoading(true)
        setError(null)

        /* Attempt to sign in via Supabase Auth */
        const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        })

        if (error) {
        /* Show the error message below the form */
        setError(error.message)
        setLoading(false)
        } else {
        /* Login successful — send user to dashboard */
        router.push('/dashboard')
        }
    }

    return (
        <div className={styles.container}>
        <div className={styles.card}>

            <div className={styles.header}>
            <h1 className={styles.logo}>Vestige</h1>
            <p className={styles.tagline}>by Ashborne</p>
            </div>

            <form onSubmit={handleLogin} className={styles.form}>

            <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                />
            </div>

            {/* Show error message if login fails */}
            {error && <p className={styles.error}>{error}</p>}

            <button
                type="submit"
                className={styles.button}
                disabled={loading}
            >
                {loading ? 'Signing in...' : 'Sign in'}
            </button>

            </form>

            <p className={styles.switch}>
            No account?{' '}
            <a href="/signup">Create one</a>
            </p>

        </div>
        </div>
    )
}