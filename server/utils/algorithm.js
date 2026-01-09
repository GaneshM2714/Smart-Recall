// server/utils/algorithm.js

// 1. FSRS PARAMETERS (Standard Weights)
const w = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

// 2. HELPER: Calculate Next Interval (in Days)
const calculateInterval = (stability) => {
  // Target 90% retention (0.9)
  const interval = 9 * stability * (1 / 0.9 - 1);
  return Math.max(1, Math.round(interval)); // Minimum 1 day
};

// 3. CORE: The FSRS Update Function
exports.calculateFSRS = (card, rating) => {
  let { stability, difficulty, reps, state } = card;
  
  // Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  // Map our Enum to FSRS numbers (1-4)
  const grade = rating === 'AGAIN' ? 1 : rating === 'HARD' ? 2 : rating === 'GOOD' ? 3 : 4;

  if (state === 'NEW') {
    // Initial Stability (S0)
    stability = w[grade - 1];
    difficulty = w[4] - (grade - 3) * w[5];
    state = grade === 1 ? 'LEARNING' : 'REVIEW';
  } else {
    // Update Difficulty (D)
    let nextD = difficulty - w[6] * (grade - 3);
    nextD = Math.max(1, Math.min(10, nextD)); // Clamp D between 1 and 10
    // Mean Reversion for D
    difficulty = w[7] * 4 + (1 - w[7]) * nextD;

    // Update Stability (S)
    if (grade === 1) {
      // Forgot (Again)
      stability = w[11] * Math.pow(difficulty, -w[12]) * (Math.pow(stability + 1, w[13]) - 1) * Math.exp(w[14] * (1 - 0.9)); 
    } else {
      // Remembered (Hard/Good/Easy)
      // Using Simplified FSRS formula for readability
      const hardPenalty = grade === 2 ? w[15] : 1;
      const easyBonus = grade === 4 ? w[16] : 1;
      stability = stability * (1 + Math.exp(w[8]) * (11 - difficulty) * Math.pow(stability, -w[9]) * (Math.exp(w[10] * (1 - 0.9)) - 1) * hardPenalty * easyBonus);
    }
  }

  reps += 1;
  const interval = calculateInterval(stability);
  
  // Calculate Next Date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return { stability, difficulty, reps, state, next_review: nextDate };
};

// 4. AUGMENTATION: The "Ripple Boost" (AR-02)
// Boosts siblings by 5% (1.05x) without changing their difficulty
exports.applyRippleBoost = (siblingCard) => {
  let { stability, next_review } = siblingCard;
  
  // AR-02.2: Apply 5% Boost
  const BOOST_FACTOR = 1.05; 
  stability = parseFloat(stability) * BOOST_FACTOR;

  // Recalculate Date based on new stability
  const interval = calculateInterval(stability);
  const newDate = new Date();
  newDate.setDate(newDate.getDate() + interval);

  return { stability, next_review: newDate };
};