/**
 * Draw Engine Utility
 * Handles winning number generation, prize pool calculation, and match checking.
 */

export interface DrawResult {
  winningNumbers: number[]
  totalPool: number
  prizes: {
    tier5: number // 40%
    tier4: number // 35%
    tier3: number // 25%
  }
  rollover: boolean
}

export interface MatchResult {
  userId: string
  matchCount: number
  tier: 3 | 4 | 5 | 0
}

/**
 * Generates 5 winning numbers (1-45)
 * @param weighted If true, weights the numbers based on historical frequency (simulated)
 */
export const generateWinningNumbers = (weighted: boolean = false): number[] => {
  const numbers: number[] = []
  
  if (weighted) {
    // Simulated weighted logic: Scores around the mode (most frequent) are slightly more likely
    // to mirror the "average golfer" consistency requirement.
    const weights = Array.from({ length: 45 }, (_, i) => {
      const score = i + 1
      // Weight higher for scores 32-40 (typical Stableford range)
      if (score >= 32 && score <= 40) return 3
      return 1
    })
    
    while (numbers.length < 5) {
      const totalWeight = weights.reduce((a, b) => a + b, 0)
      let random = Math.random() * totalWeight
      for (let i = 0; i < weights.length; i++) {
        if (random < weights[i]) {
          if (!numbers.includes(i + 1)) numbers.push(i + 1)
          break
        }
        random -= weights[i]
      }
    }
  } else {
    // Pure random
    while (numbers.length < 5) {
      const n = Math.floor(Math.random() * 45) + 1
      if (!numbers.includes(n)) numbers.push(n)
    }
  }
  
  return numbers.sort((a, b) => a - b)
}

/**
 * Calculates prize distribution based on total pool and rollovers
 */
export const calculatePrizes = (pool: number, previousRollover: number = 0) => {
  const totalAvailable = pool + previousRollover
  
  return {
    tier5: totalAvailable * 0.40,
    tier4: totalAvailable * 0.35,
    tier3: totalAvailable * 0.25
  }
}

/**
 * Checks a user's scores against winning numbers
 */
export const checkMatches = (userScores: number[], winningNumbers: number[]): MatchResult['tier'] => {
  // Use a Set for O(1) lookups
  const winningSet = new Set(winningNumbers)
  const matchCount = userScores.filter(s => winningSet.has(s)).length
  
  if (matchCount >= 5) return 5
  if (matchCount === 4) return 4
  if (matchCount === 3) return 3
  return 0
}

/**
 * Simulations for Admin Panel
 */
export const simulateDrawPerformance = (numUsers: number, winningNumbers: number[]) => {
  const results = { tier5: 0, tier4: 0, tier3: 0 }
  
  for (let i = 0; i < numUsers; i++) {
    // Mock user scores (5 per user)
    const mockScores = Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1)
    const tier = checkMatches(mockScores, winningNumbers)
    if (tier === 5) results.tier5++
    else if (tier === 4) results.tier4++
    else if (tier === 3) results.tier3++
  }
  
  return results
}
