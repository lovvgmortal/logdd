/**
 * DNA-Persona Adapter Layer
 *
 * Nhiệm vụ: Kết nối DNA (công thức viral) với Persona (tâm lý đối tượng)
 * để tạo kịch bản tối ưu nhất
 */

import type { ExtractedDNA } from './dna-extractor';
import type { AnalyzedPersona } from './persona-analyzer';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AdaptationResult {
  matchScore: number; // 0-100: Mức độ phù hợp giữa DNA và Persona
  adaptedWordCounts: { [sectionTitle: string]: number }; // Word counts đã điều chỉnh
  proofStrategy: {
    primary: string; // Loại proof chính dựa vào trustProfile
    sequence: string[]; // Thứ tự proof types
    placements: { [sectionTitle: string]: string }; // Proof nào cho section nào
  };
  objectionPlacements: Array<{
    atWordCount: number;
    inSection: string;
    objection: string;
    counterTactic: string;
  }>;
  toneAdjustments: string[]; // Các điều chỉnh tone cần thiết
  warnings: string[]; // Cảnh báo về incompatibility
}

// ============================================================================
// MATCH SCORE - Đánh giá độ phù hợp DNA ↔ Persona
// ============================================================================

/**
 * Tính điểm phù hợp giữa DNA và Persona
 * 0-100: 0 = hoàn toàn không phù hợp, 100 = hoàn hảo
 */
export function calculateMatchScore(dna: ExtractedDNA, persona: AnalyzedPersona): number {
  let score = 100;
  const issues: string[] = [];

  // 1. Knowledge Level vs Vocabulary Complexity (30 điểm)
  const vocabComplexity = estimateVocabularyComplexity(dna.voiceProfile.signatureKeywords);
  const knowledgeLevel = persona.knowledgeLevel || 'intermediate';

  if (knowledgeLevel === 'beginner' && vocabComplexity > 7) {
    score -= 20;
    issues.push('DNA vocabulary quá phức tạp cho beginner audience');
  } else if (knowledgeLevel === 'advanced' && vocabComplexity < 4) {
    score -= 10;
    issues.push('DNA vocabulary quá đơn giản cho advanced audience');
  }

  // 2. Attention Span vs Total Word Count (25 điểm)
  const attentionSpan = persona.contentConsumption?.attentionSpan || 'medium';
  const wordCount = dna.targetWordCount || 0;

  if (attentionSpan === 'short' && wordCount > 600) {
    score -= 20;
    issues.push('Script quá dài cho short attention span');
  } else if (attentionSpan === 'long' && wordCount < 400) {
    score -= 10;
    issues.push('Script quá ngắn, audience muốn deep dive');
  }

  // 3. Trust Profile vs Proof Types (25 điểm)
  if (persona.trustProfile?.primary) {
    const trustType = persona.trustProfile.primary;
    const mappedProof = mapTrustToProof(trustType);

    const hasMatchingProof = dna.persuasionFlow?.proofSequence.some(proof => {
      // Standard types
      if (trustType === 'data') return proof === 'data';
      if (trustType === 'story') return proof === 'personal-story' || proof === 'case-study';
      if (trustType === 'authority') return proof === 'expert-quote';
      if (trustType === 'social-proof') return proof === 'social-proof';

      // Custom types - check for mapped proof type or fuzzy match
      return proof === mappedProof || proof.toLowerCase().includes(trustType.toLowerCase());
    });

    if (!hasMatchingProof) {
      score -= 20;
      issues.push(`DNA thiếu proof type mà persona tin tưởng: ${trustType}`);
    }
  }

  // 4. Tone Compatibility (20 điểm)
  const dnaTone = dna.voiceProfile.toneAnalysis.toLowerCase();
  const preferredTone = (persona.preferredTone || '').toLowerCase();

  if (preferredTone && !dnaTone.includes(preferredTone)) {
    score -= 15;
    issues.push(`DNA tone (${dnaTone}) khác với preferred tone (${preferredTone})`);
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Ước tính độ phức tạp vocabulary (1-10)
 */
function estimateVocabularyComplexity(keywords: string[]): number {
  if (!keywords || keywords.length === 0) return 5;

  let complexity = 0;
  keywords.forEach(keyword => {
    const wordLength = keyword.split(' ').reduce((sum, word) => sum + word.length, 0) / keyword.split(' ').length;
    if (wordLength > 8) complexity += 2; // Từ dài = phức tạp
    else if (wordLength > 5) complexity += 1;
  });

  return Math.min(10, Math.max(1, Math.round(complexity / keywords.length * 5)));
}

// ============================================================================
// WORD COUNT ADAPTATION - Điều chỉnh độ dài theo Persona
// ============================================================================

/**
 * Điều chỉnh word counts của từng section dựa vào persona attention span
 */
export function adaptWordCounts(
  dna: ExtractedDNA,
  persona: AnalyzedPersona
): { [sectionTitle: string]: number } {
  const adapted: { [sectionTitle: string]: number } = {};
  const attentionSpan = persona.contentConsumption?.attentionSpan || 'medium';

  // Hệ số điều chỉnh dựa vào attention span
  const multiplier = attentionSpan === 'short' ? 0.75 : attentionSpan === 'long' ? 1.25 : 1.0;

  dna.structuralSkeleton.forEach(section => {
    const adjustedCount = Math.round(section.wordCount * multiplier);

    // Giới hạn min/max theo loại section
    const sectionType = section.title.toLowerCase();
    let min = 50, max = 300;

    if (sectionType.includes('hook')) {
      min = 30; max = 80;
    } else if (sectionType.includes('cta') || sectionType.includes('conclusion')) {
      min = 25; max = 60;
    } else if (sectionType.includes('main') || sectionType.includes('content')) {
      min = 120; max = 250;
    }

    adapted[section.title] = Math.max(min, Math.min(max, adjustedCount));
  });

  return adapted;
}

// ============================================================================
// PROOF INJECTION - Chọn và đặt proof phù hợp
// ============================================================================

/**
 * Xây dựng proof strategy dựa vào trustProfile của persona
 */
export function buildProofStrategy(
  dna: ExtractedDNA,
  persona: AnalyzedPersona
): AdaptationResult['proofStrategy'] {
  const trustProfile = persona.trustProfile;

  // Default proof sequence từ DNA
  let proofSequence = dna.persuasionFlow?.proofSequence || ['personal-story', 'data'];

  // Nếu có trustProfile, điều chỉnh sequence
  if (trustProfile?.primary) {
    const primaryProof = mapTrustToProof(trustProfile.primary);
    const secondaryProof = trustProfile.secondary ? mapTrustToProof(trustProfile.secondary) : null;

    // Sắp xếp lại: primary proof lên đầu
    proofSequence = [
      primaryProof,
      ...(secondaryProof ? [secondaryProof] : []),
      ...proofSequence.filter(p => p !== primaryProof && p !== secondaryProof)
    ];
  }

  // Map proof types vào sections
  const placements: { [sectionTitle: string]: string } = {};
  const mainSections = dna.structuralSkeleton.filter(s =>
    s.title.toLowerCase().includes('main') ||
    s.title.toLowerCase().includes('content') ||
    s.title.toLowerCase().includes('proof')
  );

  mainSections.forEach((section, idx) => {
    const proofType = proofSequence[idx % proofSequence.length];
    placements[section.title] = proofType;
  });

  return {
    primary: proofSequence[0],
    sequence: proofSequence,
    placements
  };
}

/**
 * Map trust type sang proof type
 * Supports both standard and custom trust types
 */
function mapTrustToProof(trustType: string): string {
  // Standard mappings
  switch (trustType) {
    case 'data': return 'data';
    case 'story': return 'personal-story';
    case 'authority': return 'expert-quote';
    case 'social-proof': return 'social-proof';

    // Custom type mappings
    case 'visual-proof': return 'before-after-demo';
    case 'experiential': return 'hands-on-example';
    case 'celebrity-endorsement': return 'influencer-quote';
    case 'scientific-method': return 'peer-reviewed-study';
    case 'community-driven': return 'community-testimonial';

    // Default: treat custom types as-is (AI will handle in script generation)
    default: return trustType;
  }
}

// ============================================================================
// OBJECTION PLACEMENT - Đặt objection handlers đúng chỗ
// ============================================================================

/**
 * Xác định vị trí đặt objection handlers trong script
 */
export function placeObjectionHandlers(
  dna: ExtractedDNA,
  persona: AnalyzedPersona
): AdaptationResult['objectionPlacements'] {
  const placements: AdaptationResult['objectionPlacements'] = [];

  // Lấy objections từ persona hoặc DNA
  const personaObjections = persona.objectionTimeline || [];
  const dnaFrictionPoints = dna.frictionPoints?.filter(fp => fp.type === 'objection') || [];

  // Prioritize persona objectionTimeline
  if (personaObjections.length > 0) {
    personaObjections.forEach(obj => {
      const section = findSectionAtWordCount(dna, obj.atWordCount);
      placements.push({
        atWordCount: obj.atWordCount,
        inSection: section?.title || 'Unknown Section',
        objection: obj.objection,
        counterTactic: obj.counterTactic
      });
    });
  } else {
    // Fallback: Sử dụng DNA friction points
    let cumulativeWords = 0;
    dnaFrictionPoints.forEach((fp, idx) => {
      const targetWordCount = 200 + (idx * 250); // Spread out objections
      const section = findSectionAtWordCount(dna, targetWordCount);

      placements.push({
        atWordCount: targetWordCount,
        inSection: section?.title || 'Main Content',
        objection: fp.point,
        counterTactic: fp.solution || 'Address with proof and evidence'
      });
    });
  }

  return placements;
}

/**
 * Tìm section tại word count milestone
 */
function findSectionAtWordCount(dna: ExtractedDNA, wordCount: number): typeof dna.structuralSkeleton[0] | null {
  let cumulative = 0;
  for (const section of dna.structuralSkeleton) {
    cumulative += section.wordCount;
    if (cumulative >= wordCount) {
      return section;
    }
  }
  return dna.structuralSkeleton[dna.structuralSkeleton.length - 1] || null;
}

// ============================================================================
// MAIN ADAPTER FUNCTION - Kết hợp tất cả
// ============================================================================

/**
 * Adapter chính: Phân tích và điều chỉnh DNA cho Persona cụ thể
 */
export function adaptDNAToPersona(
  dna: ExtractedDNA,
  persona: AnalyzedPersona
): AdaptationResult {
  const matchScore = calculateMatchScore(dna, persona);
  const adaptedWordCounts = adaptWordCounts(dna, persona);
  const proofStrategy = buildProofStrategy(dna, persona);
  const objectionPlacements = placeObjectionHandlers(dna, persona);

  // Tone adjustments
  const toneAdjustments: string[] = [];
  const preferredTone = persona.preferredTone?.toLowerCase() || '';
  const dnaTone = dna.voiceProfile.toneAnalysis.toLowerCase();

  if (preferredTone && !dnaTone.includes(preferredTone)) {
    toneAdjustments.push(`Điều chỉnh tone từ "${dnaTone}" sang "${preferredTone}"`);
  }

  if (persona.knowledgeLevel === 'beginner') {
    toneAdjustments.push('Thêm giải thích cho thuật ngữ kỹ thuật');
    toneAdjustments.push('Sử dụng ví dụ đơn giản, dễ hiểu');
  }

  // Warnings
  const warnings: string[] = [];
  if (matchScore < 60) {
    warnings.push(`⚠️ Match score thấp (${matchScore}/100) - DNA và Persona không phù hợp lắm`);
  }

  if (persona.actionBarriers?.includes('skepticism') && !dna.persuasionFlow?.proofSequence.includes('data')) {
    warnings.push('⚠️ Persona rất skeptical nhưng DNA thiếu data-driven proof');
  }

  return {
    matchScore,
    adaptedWordCounts,
    proofStrategy,
    objectionPlacements,
    toneAdjustments,
    warnings
  };
}
