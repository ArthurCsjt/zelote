import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      const next = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile((prev) => (prev !== next ? next : prev))
    }
    mql.addEventListener("change", onChange)
    const initial = window.innerWidth < MOBILE_BREAKPOINT
    setIsMobile((prev) => (prev !== initial ? initial : prev))
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
