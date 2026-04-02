/* ============================================
   account.jsx
   Vestige — Ashborne
   User account management page — change email,
   change password, and delete account.
   Protected route.
   ============================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import supabase from '../lib/supabaseClient'
import styles from '../styles/Account.module.css'
import toast from 'react-hot-toast'
import { useBreadcrumb } from '../lib/BreadcrumbContext'

export default function Account() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /* Email change state */
  const [newEmail, setNewEmail] = useState('')
  const [updatingEmail, setUpdatingEmail] = useState(false)

  /* Password change state */
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  /* Delete account state */
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const { setCrumbs } = useBreadcrumb()

  useEffect(() => {
    setCrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Account' }
    ])
  }, [setCrumbs])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      setLoading(false)
    }

    init()
  }, [router])

  /* Update email address via Supabase Auth
     Supabase sends a confirmation email to the new address */
  async function handleUpdateEmail(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setUpdatingEmail(true)

    const { error } = await supabase.auth.updateUser({
      email: newEmail.trim()
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Confirmation email sent to your new address')
      setNewEmail('')
    }

    setUpdatingEmail(false)
  }

  /* Update password via Supabase Auth */
  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setUpdatingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    }

    setUpdatingPassword(false)
  }

  /* Delete account — requires typing DELETE to confirm
     Deletes all user data via cascade then signs out */
  async function handleDeleteAccount(e) {
    e.preventDefault()
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    setDeleting(true)

    /* Delete all subjects — cascade handles topics,
       flashcards, notes, questions and sessions */
    await supabase
      .from('subjects')
      .delete()
      .eq('user_id', user.id)

    /* Sign out the user */
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return null

  return (
    <div className={styles.page}>
      <main className={styles.main}>

        <div className={styles.pageHeader}>
          <h1>Account</h1>
          <p>{user?.email}</p>
        </div>

        {/* Change email section */}
        <section className={styles.section}>
          <h2>Change Email</h2>
          <p className={styles.sectionDescription}>
            A confirmation link will be sent to your new email address.
          </p>
          <form onSubmit={handleUpdateEmail} className={styles.form}>
            <div className={styles.field}>
              <label>New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={updatingEmail}
              className={styles.saveButton}
            >
              {updatingEmail ? 'Sending...' : 'Update Email'}
            </button>
          </form>
        </section>

        {/* Change password section */}
        <section className={styles.section}>
          <h2>Change Password</h2>
          <p className={styles.sectionDescription}>
            Must be at least 6 characters.
          </p>
          <form onSubmit={handleUpdatePassword} className={styles.form}>
            <div className={styles.field}>
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={updatingPassword}
              className={styles.saveButton}
            >
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Delete account section */}
        <section className={`${styles.section} ${styles.dangerSection}`}>
          <h2>Delete Account</h2>
          <p className={styles.sectionDescription}>
            Permanently deletes your account and all revision data.
            This cannot be undone.
          </p>
          <form onSubmit={handleDeleteAccount} className={styles.form}>
            <div className={styles.field}>
              <label>Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <button
              type="submit"
              disabled={deleting || deleteConfirm !== 'DELETE'}
              className={styles.deleteButton}
            >
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </form>
        </section>

      </main>
    </div>
  )
}