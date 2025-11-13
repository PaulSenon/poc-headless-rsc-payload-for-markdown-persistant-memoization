// RSC entry for @vitejs/plugin-rsc
// Import scanner to ensure shared client components are scanned during build
import "./lib/rsc-scanner";

export default function RscEntry() {
  // This entry is not actually used for rendering, but the import above
  // ensures the RSC plugin scans shared client components during build
  return null;
}
