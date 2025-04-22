
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      // Simplificando a detecção para maior confiabilidade
      // Priorizar screen width para uma detecção mais consistente
      const hasSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      
      console.log('[DEBUG] Mobile detection:', { 
        windowWidth: window.innerWidth,
        hasSmallScreen,
        breakpoint: MOBILE_BREAKPOINT
      })
      
      setIsMobile(hasSmallScreen)
    }
    
    // Initial check and set up listeners
    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)
    
    // Force additional check after a short delay (helps with some mobile browsers)
    const timeout = setTimeout(checkMobile, 500)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
      clearTimeout(timeout)
    }
  }, [])

  return isMobile
}

export const useIsMobile = useMobile
