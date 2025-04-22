
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      const hasSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(hasSmallScreen)
    }
    
    // Initial check
    checkMobile()
    
    // Setup listeners for window resize
    window.addEventListener('resize', checkMobile)
    
    // Force additional check after a delay to handle some edge cases
    const timeout = setTimeout(checkMobile, 100)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearTimeout(timeout)
    }
  }, [])

  return isMobile
}

export const useIsMobile = useMobile
