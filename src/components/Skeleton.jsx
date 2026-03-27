/* ============================================
    Skeleton.jsx
    Vestige — Ashborne
    Reusable skeleton loader component.
    Used as a placeholder while page data loads.
    Pass width and height to control the size,
    or use the preset variants via className.
   ============================================ */

import styles from '../styles/Skeleton.module.css'

export default function Skeleton({ width, height, className }) {
    return (
        <div
        className={`${styles.skeleton} ${className || ''}`}
        style={{
            width: width || '100%',
            height: height || '1rem',
        }}
        />
    )
}