
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Don't run on server
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      // Check for touch capability as primary indicator of mobile device
      const hasTouchScreen = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - MS prefixed properties
        navigator.msMaxTouchPoints > 0
      )
      
      // User agent check as secondary indicator
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
        'windows phone', 'mobile', 'tablet'
      ]
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword))
      
      // Screen size check as tertiary indicator
      const hasSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      
      // Determine if mobile based on combination of factors - prioritize user agent detection
      // for mobile browsers over just screen size to improve reliability
      const mobileDevice = isMobileUserAgent || (hasTouchScreen && hasSmallScreen)
      
      setIsMobile(mobileDevice)
    }
    
    checkMobile()
    
    // Listen for orientation changes and resize events
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)
    
    // Cleanup listeners
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  return isMobile
}

// Export both names for backward compatibility
export const useIsMobile = useMobile
