
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      // Use a combination of methods for reliable detection
      
      // 1. User agent detection - most reliable for actual mobile devices
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
        'windows phone', 'mobile', 'tablet'
      ]
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword))
      
      // 2. Touch capability - for tablets and touch devices
      const hasTouchScreen = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - MS prefixed properties
        navigator.msMaxTouchPoints > 0
      )
      
      // 3. Screen width - fallback for desktop in narrow window
      const hasSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      
      // Combine all factors - prioritize user agent detection
      const result = isMobileUserAgent || (hasTouchScreen && hasSmallScreen)
      
      console.log('[DEBUG] Mobile detection:', { 
        isMobileUserAgent, 
        userAgent,
        hasTouchScreen,
        hasSmallScreen,
        windowWidth: window.innerWidth,
        result
      })
      
      setIsMobile(result)
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
