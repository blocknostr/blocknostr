import * as React from "react"
import { useResponsive } from "./use-responsive";

// Backward compatibility - keep original implementation as fallback
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Try to use the new responsive hook first
  try {
    const { isMobile } = useResponsive();
    return isMobile;
  } catch (error) {
    // Fallback to original implementation if responsive hook fails
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

    React.useEffect(() => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      }
      mql.addEventListener("change", onChange)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile
  }
}

