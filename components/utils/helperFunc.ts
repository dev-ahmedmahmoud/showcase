// Utility functions to detect device and browser capabilities
export function isTouchDevice() {
  return typeof window !== "undefined" && (
    "ontouchstart" in window || navigator.maxTouchPoints > 0
  );
}

// Detects if the browser is running in a VR headset (Quest, Oculus, etc.)
export function isVRHeadsetBrowser() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /OculusBrowser|Oculus/i.test(ua) ||
    /Quest|Oculus Quest/i.test(ua) ||
    /PicoBrowser|Pico/i.test(ua) ||
    /Viveport|Vive/i.test(ua) ||
    /XR/i.test(ua)
  );
}
// Detects if browser is in mobile emulation mode (DevTools, Android Studio, Xcode Simulator)
export function isEmulatedMobile() {
  if (typeof window === "undefined") return false;
  const uaData = (navigator as any).userAgentData;
  if (uaData && uaData.mobile !== undefined) {
    return uaData.mobile;
  }
  const ua = navigator.userAgent;
  // Chrome DevTools iPhone emulation: UA contains iPhone
  if (/iPhone|iPod/i.test(ua)) {
    return true;
  }
  // Android Studio and Xcode emulators often use generic device user agents
  if (/Android.*(Emulator|sdk_gphone|sdk_phone|generic)/i.test(ua)) {
    return true;
  }
  if (/iPhone Simulator|iPad Simulator|x86_64|arm64/i.test(ua)) {
    return true;
  }
  return false;
}

// Detects if browser is in tablet emulation mode (DevTools, Android Studio, Xcode Simulator)
export function isEmulatedTablet() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad/i.test(ua)) {
    return true;
  }
  if (/Android.*(Emulator|sdk_gphone|sdk_phone|generic).*Tablet/i.test(ua)) {
    return true;
  }
  if (/iPad Simulator|iPad; CPU OS/i.test(ua)) {
    return true;
  }
  return false;
}

export function isTablet() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const ua = nav.userAgent;
  const platform = nav.platform || '';
  // iPad real or emulated
  if (/iPad/.test(ua)) return true;
  // iPad emulation: UA is Macintosh, touch support, iPad viewport
  if (/Macintosh/.test(ua) && 'ontouchstart' in window && window.innerWidth >= 768 && window.innerWidth <= 1366) return true;
  // Android tablets: SM-T (Samsung), Tablet keyword, or large Android device
  if (/SM-T/.test(ua) || /Tablet/.test(ua)) return true;
  // Nexus/other tablets
  if (/Nexus 7|Nexus 10|KFAPWI/i.test(ua)) return true;
  // Exclude if mobile keywords present
  if (/Mobi|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return false;
  // Fallback: large touch device
  if (isTouchDevice() && window.innerWidth > 600 && window.innerWidth <= 1366) return true;
  return false;
}

export function isMobile() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const ua = nav.userAgent;
  const platform = nav.platform || '';
  // iPhone real or emulated
  if (/iPhone|iPod/.test(ua)) return true;
  // Android phones: Android + Mobile, not Tablet
  if (/Android/.test(ua) && /Mobile/.test(ua) && !/Tablet/.test(ua)) return true;
  // Samsung Galaxy phones: SM-G
  if (/SM-G/.test(ua)) return true;
  // Exclude tablets
  if (isTablet()) return false;
  // Fallback: small touch device
  if (isTouchDevice() && window.innerWidth <= 600) return true;
  return false;
}