/* ============================================
    BreadcrumbContext.js
    Vestige — Ashborne
    Global context for breadcrumb trail data.
    Pages set their breadcrumb on mount and the
    Navbar reads it to display the trail.
   ============================================ */

import { createContext, useContext, useState } from 'react'

const BreadcrumbContext = createContext(null)

/* Wrap the app in this provider so any page
   can set breadcrumb data and the navbar can read it */
export function BreadcrumbProvider({ children }) {
    const [crumbs, setCrumbs] = useState([])
    return (
        <BreadcrumbContext.Provider value={{ crumbs, setCrumbs }}>
        {children}
        </BreadcrumbContext.Provider>
    )
}

/* Hook for pages to set their breadcrumb trail */
export function useBreadcrumb() {
    return useContext(BreadcrumbContext)
}