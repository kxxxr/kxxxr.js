export { waterHoverEffect } from "./effects/waterHover.js";
export { realisticWaterHoverEffect } from "./effects/realisticWaterHover.js";
export { glitchEffect } from "./effects/glitch.js";
export { fluidSimulationEffect } from "./effects/fluidSimulation.js";

// Export auto-initialization
export {
  initKxxxrEffects,
  cleanupKxxxrEffects,
  reinitKxxxrEffects,
} from "./auto-init.js";

// Auto-initialize effects on page load
import "./auto-init.js";
