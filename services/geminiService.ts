
// Barrel file - now with updated signatures expecting API Keys
// The underlying files (blueprintGenerator, etc.) need updates too, but we can do it via this interface if we export them correctly.
// However, since we are changing the function signatures deeply, we must update the individual files.
// This file just re-exports.

export { extractScriptDNA, refineScriptDNA } from './gemini/dnaAnalysis';
export { generateScriptBlueprint, generateScriptStructure } from './gemini/blueprintGenerator';
export { 
  generateSectionScript, 
  generateScriptFromBlueprint, 
  refineSection,
  generateNodeContent
} from './gemini/scriptWriter';
export { analyzeScriptScore } from './gemini/scoring';
