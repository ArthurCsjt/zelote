
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isReady, setIsReady] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      const hasSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(hasSmallScreen)
      setIsReady(true)
    }
    
    // Initial check
    checkMobile()
    
    // Setup listeners for window resize
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return { isMobile, isReady }
}

export const useIsMobile = useMobile
