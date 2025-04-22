
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      // Prioritize user agent detection for more reliable mobile detection
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = [
        'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
        'windows phone', 'mobile', 'tablet'
      ]
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword))
      
      // Use touch capability as secondary indicator
      const hasTouchScreen = (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - MS prefixed properties
        navigator.msMaxTouchPoints > 0
      )
      
      // Screen size as final check
      const hasSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
      
      // Set mobile state based on multiple indicators for better reliability
      setIsMobile(isMobileUserAgent || (hasTouchScreen && hasSmallScreen))
      
      // Force debug logging to check detection
      console.log('Mobile detection:', { 
        isMobileUserAgent, 
        hasTouchScreen, 
        hasSmallScreen, 
        result: isMobileUserAgent || (hasTouchScreen && hasSmallScreen),
        width: window.innerWidth,
        ua: navigator.userAgent 
      });
    }
    
    // Run detection immediately
    checkMobile()
    
    // Set up listeners for orientation/resize changes
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  return isMobile
}

export const useIsMobile = useMobile
