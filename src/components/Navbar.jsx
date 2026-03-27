/* ============================================
    Navbar.jsx
    Vestige — Ashborne
    Global top navigation bar. Desktop shows full
    nav. Mobile collapses to hamburger menu.
   ============================================ */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import SearchBar from './SearchBar'
import { useBreadcrumb } from '../lib/BreadcrumbContext'
import styles from '../styles/Navbar.module.css'

export default function Navbar() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [theme, setTheme] = useState('light')
    const [menuOpen, setMenuOpen] = useState(false)
    const { crumbs } = useBreadcrumb()

    /* Close menu on route change */
    useEffect(() => {
        const timer = setTimeout(() => setMenuOpen(false), 0)
        return () => clearTimeout(timer)
    }, [router.pathname])

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

    function navigate(path) {
        setMenuOpen(false)
        router.push(path)
    }

    const hideOn = ['/login', '/signup']
    if (hideOn.includes(router.pathname)) return null
    if (!user) return null

    return (
        <>
        <nav className={styles.navbar}>
            <button
            className={styles.logo}
            onClick={() => router.push('/dashboard')}
            >
            Vestige
            </button>

            {/* Breadcrumb — desktop only */}
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
                    <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                    )}
                </span>
                ))}
            </div>
            )}

            {/* Search — desktop only */}
            <div className={styles.center}>
            <SearchBar userId={user.id} />
            </div>

            {/* Desktop right side */}
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

            {/* Hamburger — mobile only */}
            <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            >
            {menuOpen ? '✕' : '☰'}
            </button>
        </nav>

        {/* Mobile menu */}
        <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}>
            <div className={styles.mobileSearchWrap}>
            <SearchBar userId={user.id} />
            </div>

            <div className={styles.mobileNav}>
            <button
                className={styles.mobileNavButton}
                onClick={() => navigate('/dashboard')}
            >
                Dashboard
            </button>
            <button
                className={styles.mobileNavButton}
                onClick={() => navigate('/progress')}
            >
                Progress
            </button>
            <button
                className={styles.mobileNavButton}
                onClick={handleThemeToggle}
            >
                {theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            </button>
            <button
                className={styles.mobileNavButton}
                onClick={handleLogout}
            >
                Sign out
            </button>
            </div>

            <span className={styles.mobileEmail}>{user.email}</span>
        </div>
        </>
    )
}