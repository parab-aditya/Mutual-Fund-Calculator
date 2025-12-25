import { OptimizationSolution, AIRecommendation, DifficultyLevel } from './types';

/**
 * Calculate difficulty level based on step-up and SIP increase percentages
 */
export const calculateDifficulty = (stepUpPercent: number, sipIncreasePercent: number): DifficultyLevel => {
    // Easy: only step-up up to 5% OR only SIP increase up to 10%
    if ((stepUpPercent <= 5 && sipIncreasePercent === 0) ||
        (stepUpPercent === 0 && sipIncreasePercent <= 10)) {
        return 'Easy';
    }

    // Aggressive: both high values or very high single values
    if ((stepUpPercent >= 10 && sipIncreasePercent >= 10) ||
        stepUpPercent > 10 || sipIncreasePercent > 15) {
        return 'Aggressive';
    }

    // Moderate: everything else
    return 'Moderate';
};

/**
 * Build the structured prompt for AI (minimal tokens)
 * Only requests: recommendedIndex and difficulty (the only fields we actually use)
 */
export const buildPrompt = (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): string => {
    // Minimal solution data - only what's needed for ranking
    const solutionsData = solutions.map((s, index) => ({
        i: index,
        fi: s.fiAge,
        su: s.stepUpPercent,
        si: s.sipIncreasePercent
    }));

    return `Pick the best financial independence (FI) solution.

Context: Baseline FI=${baselineFiAge}, Target=${preferences.targetAge}

Solutions (i=index, fi=FI age, su=step-up%, si=SIP increase%):
${JSON.stringify(solutionsData)}

Rank by: 1) Lowest fi, 2) Lowest su, 3) Lowest si
Bonus: fi≤${preferences.targetAge} is preferred even with slightly higher su/si.

Respond JSON only:
{"recommendedIndex":<number>,"difficulty":"Easy"|"Moderate"|"Aggressive"}

Difficulty: Easy=su≤5 OR si≤10, Aggressive=su≥10 AND si≥10, else Moderate`;
};

/**
 * Parse the AI response and extract recommendation
 * AI only returns recommendedIndex and difficulty - we generate explanation/alternatives locally
 */
export const parseAIResponse = (response: string, solutions: OptimizationSolution[]): AIRecommendation => {
    try {
        // Clean up response - remove markdown code blocks if present
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.slice(7);
        }
        if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.slice(3);
        }
        if (cleanResponse.endsWith('```')) {
            cleanResponse = cleanResponse.slice(0, -3);
        }
        cleanResponse = cleanResponse.trim();

        const parsed = JSON.parse(cleanResponse);

        // Validate the recommended index
        const recommendedIndex = parseInt(parsed.recommendedIndex, 10);
        if (isNaN(recommendedIndex) || recommendedIndex < 0 || recommendedIndex >= solutions.length) {
            throw new Error('Invalid recommended index');
        }

        // Validate and extract difficulty
        const recommendedSolution = solutions[recommendedIndex];
        let difficulty: DifficultyLevel = parsed.difficulty;
        if (!['Easy', 'Moderate', 'Aggressive'].includes(difficulty)) {
            difficulty = calculateDifficulty(recommendedSolution.stepUpPercent, recommendedSolution.sipIncreasePercent);
        }

        // Generate explanation locally (not from AI to save tokens)
        const explanation = `Recommended: ${recommendedSolution.stepUpPercent}% step-up + ${recommendedSolution.sipIncreasePercent}% SIP increase for FI at age ${recommendedSolution.fiAge}.`;

        return {
            recommendedIndex,
            explanation,
            alternatives: [], // We don't display alternatives in UI
            difficulty
        };
    } catch (error) {
        console.error('Failed to parse AI response:', error, response);
        // Return first solution as fallback with calculated difficulty
        const fallbackSolution = solutions[0];
        return {
            recommendedIndex: 0,
            explanation: 'This solution offers significant improvement in your financial independence timeline.',
            alternatives: [],
            difficulty: calculateDifficulty(fallbackSolution.stepUpPercent, fallbackSolution.sipIncreasePercent)
        };
    }
};

/**
 * Fallback ranking algorithm when Gemini API is unavailable
 * Uses weighted scoring: FI age (50%), step-up (30%), SIP increase (20%)
 */
export const getFallbackRecommendation = (
    baselineFiAge: number,
    solutions: OptimizationSolution[],
    preferences: { preferLowerStepUp: boolean; preferLowerSipIncrease: boolean; targetAge: number }
): AIRecommendation => {
    if (solutions.length === 0) {
        return {
            recommendedIndex: -1,
            explanation: 'No optimization solutions available.',
            alternatives: [],
            difficulty: 'Easy'
        };
    }

    // Score each solution
    const scoredSolutions = solutions.map((solution, index) => {
        let score = 0;

        // FI age score (lower is better) - weight 50
        const fiAgeScore = (baselineFiAge - solution.fiAge) * 5;
        score += fiAgeScore;

        // Step-up penalty (lower is better) - weight 30
        const stepUpPenalty = solution.stepUpPercent * 3;
        score -= stepUpPenalty;

        // SIP increase penalty (lower is better) - weight 20
        const sipIncreasePenalty = solution.sipIncreasePercent * 2;
        score -= sipIncreasePenalty;

        // Bonus for reaching target age
        if (solution.fiAge <= preferences.targetAge) {
            score += 20; // Big bonus for hitting target
        }

        return { index, solution, score };
    });

    // Sort by score descending
    scoredSolutions.sort((a, b) => b.score - a.score);

    const best = scoredSolutions[0];
    const alternatives: string[] = [];

    // Generate alternative descriptions
    if (scoredSolutions.length > 1) {
        const second = scoredSolutions[1];
        if (second.solution.stepUpPercent === 0 && second.solution.sipIncreasePercent > 0) {
            alternatives.push(`${second.solution.sipIncreasePercent}% SIP increase alone reaches FI at ${second.solution.fiAge}`);
        } else if (second.solution.sipIncreasePercent === 0 && second.solution.stepUpPercent > 0) {
            alternatives.push(`${second.solution.stepUpPercent}% step-up alone reaches FI at ${second.solution.fiAge}`);
        } else {
            alternatives.push(`${second.solution.stepUpPercent}% step-up + ${second.solution.sipIncreasePercent}% SIP increase reaches FI at ${second.solution.fiAge}`);
        }
    }

    if (scoredSolutions.length > 2) {
        const third = scoredSolutions[2];
        alternatives.push(`Alternative: FI at ${third.solution.fiAge} with ${third.solution.stepUpPercent}% step-up and ${third.solution.sipIncreasePercent}% SIP increase`);
    }

    // Generate explanation
    let explanation = '';
    if (best.solution.fiAge <= preferences.targetAge) {
        explanation = `This plan reaches your target FI age of ${preferences.targetAge} with a ${best.solution.stepUpPercent}% annual step-up and ${best.solution.sipIncreasePercent}% SIP increase, offering the ideal balance of goal achievement and effort.`;
    } else {
        explanation = `This plan reduces your FI age from ${baselineFiAge} to ${best.solution.fiAge} (${best.solution.improvementYears} years earlier) with minimal adjustments to your current savings behavior.`;
    }

    // Calculate difficulty for the recommended solution
    const difficulty = calculateDifficulty(best.solution.stepUpPercent, best.solution.sipIncreasePercent);

    return {
        recommendedIndex: best.index,
        explanation,
        alternatives,
        difficulty
    };
};
