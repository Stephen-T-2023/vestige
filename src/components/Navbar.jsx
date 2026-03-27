/* ============================================
    Navbar.jsx
    Vestige — Ashborne
    Global top navigation bar. Renders on every
    page except login and signup. Handles session
    checking, search, navigation and breadcrumbs.
   ============================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import SearchBar from './SearchBar'
import { useBreadcrumb } from '../lib/BreadcrumbContext'
import styles from '../styles/Navbar.module.css'

export default function Navbar() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [theme, setTheme] = useState('light')
    const { crumbs } = useBreadcrumb()

    useEffect(() => {
        async function getUser() {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)

        const savedTheme = localStorage.getItem('vestige-theme') || 'light'
        setTheme(savedTheme)
        }

        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            setUser(session?.user ?? null)
        }
        )

        return () => subscription.unsubscribe()
    }, [])

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
    }

    function handleThemeToggle() {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('vestige-theme', newTheme)
    }

    const hideOn = ['/login', '/signup']
    if (hideOn.includes(router.pathname)) return null
    if (!user) return null

    return (
        <nav className={styles.navbar}>
        <button
            className={styles.logo}
            onClick={() => router.push('/dashboard')}
        >
            Vestige
        </button>

        {/* Breadcrumb trail — shown when crumbs are set by the current page */}
        {crumbs.length > 0 && (
            <div className={styles.breadcrumb}>
            {crumbs.map((crumb, index) => (
                <span key={index} className={styles.breadcrumbItem}>
                {index > 0 && <span className={styles.breadcrumbSep}>›</span>}
                {crumb.href ? (
                    <button
                    className={styles.breadcrumbLink}
                    onClick={() => router.push(crumb.href)}
                    >
                    {crumb.label}
                    </button>
                ) : (
                    /* Last crumb has no link — it's the current page */
                    <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                )}
                </span>
            ))}
            </div>
        )}

        <div className={styles.center}>
            <SearchBar userId={user.id} />
        </div>

        <div className={styles.right}>
            <button
            className={styles.themeToggle}
            onClick={handleThemeToggle}
            aria-label="Toggle dark mode"
            >
            {theme === 'light' ? '●' : '○'}
            </button>
            <button
            className={styles.navLink}
            onClick={() => router.push('/progress')}
            >
            Progress
            </button>
            <span className={styles.email}>{user.email}</span>
            <button
            className={styles.logoutButton}
            onClick={handleLogout}
            >
            Sign out
            </button>
        </div>
        </nav>
    )
}