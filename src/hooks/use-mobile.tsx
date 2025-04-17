import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)
      
      if (isMobileDevice) {
        setIsMobile(true)
        return
      }
      
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      checkMobile()
    }
    
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

export const useIsMobile = useMobile
