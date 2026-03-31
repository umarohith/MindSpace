// MediaPipe Hands landmark indices
const LM = {
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
};

// Euclidean distance between two landmarks (2D for reliability)
function dist(a, b) {
  if (!a || !b) return 999;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Is finger tip above its PIP joint? (finger extended)
// In MediaPipe coords: y=0 is top of image, y=1 is bottom
function isExtended(lm, tip, pip) {
  return lm[tip].y < lm[pip].y;
}

// Is finger tip BELOW its PIP joint? (finger curled/bent)
function isBent(lm, tip, pip) {
  return lm[tip].y > lm[pip].y;
}

// Are two tips close enough to be "touching"?
function isTouching(lm, a, b, threshold = 0.07) {
  return dist(lm[a], lm[b]) < threshold;
}

// ─────────────────────────────────────────────────────────────────────────────
// GYAN MUDRA: Index tip touches thumb tip, other 3 fingers extended
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeGyanMudra(landmarks) {
  const lm = landmarks;
  if (!lm || lm.length < 21) return { correct: false, confidence: 0, message: 'No hand detected', tip: 'Move your hand into the camera frame.' };

  const thumbIndexContact = isTouching(lm, LM.THUMB_TIP, LM.INDEX_TIP, 0.075);
  const middleExtended   = isExtended(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP);
  const ringExtended     = isExtended(lm, LM.RING_TIP,   LM.RING_PIP);
  const pinkyExtended    = isExtended(lm, LM.PINKY_TIP,  LM.PINKY_PIP);

  if (thumbIndexContact && middleExtended && ringExtended && pinkyExtended) {
    return { correct: true, confidence: 1, message: 'Gyan Mudra — Perfect! ✓', tip: '' };
  }

  // Specific correction
  if (!thumbIndexContact) {
    const d = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]);
    if (d > 0.18) return { correct: false, confidence: 0.1, message: 'Index finger far from thumb', tip: 'Bring your index fingertip to meet your thumb tip.' };
    return { correct: false, confidence: 0.4, message: 'Almost there — close the gap!', tip: 'Touch index fingertip gently to your thumb tip.' };
  }
  if (!middleExtended) return { correct: false, confidence: 0.5, message: 'Middle finger is bent', tip: 'Straighten your middle finger outward.' };
  if (!ringExtended)   return { correct: false, confidence: 0.5, message: 'Ring finger is bent', tip: 'Extend your ring finger fully.' };
  if (!pinkyExtended)  return { correct: false, confidence: 0.5, message: 'Little finger is curled', tip: 'Straighten your pinky finger.' };

  return { correct: false, confidence: 0.4, message: 'Hold the posture steady', tip: 'Keep all extended fingers straight and still.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRANA MUDRA: Ring + Pinky tips touch thumb tip, index + middle extended
// ─────────────────────────────────────────────────────────────────────────────
export function analyzePranaMudra(landmarks) {
  const lm = landmarks;
  if (!lm || lm.length < 21) return { correct: false, confidence: 0, message: 'No hand detected', tip: 'Move your hand into the camera frame.' };

  const ringThumb   = isTouching(lm, LM.THUMB_TIP, LM.RING_TIP,  0.08);
  const pinkyThumb  = isTouching(lm, LM.THUMB_TIP, LM.PINKY_TIP, 0.09);
  const indexExtended  = isExtended(lm, LM.INDEX_TIP,  LM.INDEX_PIP);
  const middleExtended = isExtended(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP);

  if (ringThumb && pinkyThumb && indexExtended && middleExtended) {
    return { correct: true, confidence: 1, message: 'Prana Mudra — Excellent! ✓', tip: '' };
  }

  if (!ringThumb && !pinkyThumb) return { correct: false, confidence: 0.1, message: 'Ring & little fingers not touching thumb', tip: 'Curl your ring and little fingers to meet your thumb tip.' };
  if (!ringThumb)   return { correct: false, confidence: 0.4, message: 'Ring finger not touching thumb', tip: 'Fold your ring fingertip all the way to the thumb.' };
  if (!pinkyThumb)  return { correct: false, confidence: 0.4, message: 'Little finger not touching thumb', tip: 'Bring your pinky to join the ring finger on the thumb.' };
  if (!indexExtended)  return { correct: false, confidence: 0.5, message: 'Index finger is bent', tip: 'Straighten and extend your index finger upward.' };
  if (!middleExtended) return { correct: false, confidence: 0.5, message: 'Middle finger is bent', tip: 'Straighten and extend your middle finger upward.' };

  return { correct: false, confidence: 0.4, message: 'Refining posture...', tip: 'Hold all fingers in position and stay still.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHUNI MUDRA: Middle tip touches thumb, index + ring + pinky extended
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeShiniMudra(landmarks) {
  const lm = landmarks;
  if (!lm || lm.length < 21) return { correct: false, confidence: 0, message: 'No hand detected', tip: 'Move your hand into the camera frame.' };

  const middleThumb    = isTouching(lm, LM.THUMB_TIP, LM.MIDDLE_TIP, 0.075);
  const indexExtended  = isExtended(lm, LM.INDEX_TIP,  LM.INDEX_PIP);
  const ringExtended   = isExtended(lm, LM.RING_TIP,   LM.RING_PIP);
  const pinkyExtended  = isExtended(lm, LM.PINKY_TIP,  LM.PINKY_PIP);

  if (middleThumb && indexExtended && ringExtended && pinkyExtended) {
    return { correct: true, confidence: 1, message: 'Shuni Mudra — Perfect! ✓', tip: '' };
  }

  if (!middleThumb) {
    const d = dist(lm[LM.THUMB_TIP], lm[LM.MIDDLE_TIP]);
    if (d > 0.2) return { correct: false, confidence: 0.1, message: 'Middle finger far from thumb', tip: 'Curl your middle finger down to touch the thumb tip.' };
    return { correct: false, confidence: 0.4, message: 'Middle not quite touching thumb', tip: 'Bring your middle fingertip just a little closer.' };
  }
  if (!indexExtended)  return { correct: false, confidence: 0.5, message: 'Index finger is curled in', tip: 'Extend your index finger fully upward.' };
  if (!ringExtended)   return { correct: false, confidence: 0.5, message: 'Ring finger is bent', tip: 'Straighten your ring finger outward.' };
  if (!pinkyExtended)  return { correct: false, confidence: 0.5, message: 'Little finger is bent', tip: 'Extend your little finger fully.' };

  return { correct: false, confidence: 0.4, message: 'Almost there...', tip: 'Hold the position still.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// DHYANA MUDRA: Both hands, palms up, thumbs touching — approximate with 1 hand
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeDhyanaMudra(landmarks, allHands) {
  if (!landmarks || landmarks.length < 21) return { correct: false, confidence: 0, message: 'No hand detected', tip: 'Place both hands on your lap with palms facing up.' };

  // Check if we can detect 2 hands
  if (allHands && allHands.length >= 2) {
    const lm1 = allHands[0].landmarks;
    const lm2 = allHands[1].landmarks;
    if (lm1 && lm2) {
      // Check thumbs are close
      const thumbDist = dist(lm1[LM.THUMB_TIP], lm2[LM.THUMB_TIP]);
      if (thumbDist < 0.15) {
        return { correct: true, confidence: 1, message: 'Dhyana Mudra — Beautiful! ✓', tip: '' };
      }
      return { correct: false, confidence: 0.5, message: 'Move thumbs closer together', tip: 'Gently bring both thumb tips to touch each other.' };
    }
  }

  // Single hand fallback — check palm-up orientation & all fingers relaxed/slightly extended
  const lm = landmarks;
  const allRelaxed = !isBent(lm, LM.INDEX_TIP, LM.INDEX_MCP) || !isBent(lm, LM.MIDDLE_TIP, LM.MIDDLE_MCP);

  if (allHands && allHands.length < 2) {
    return { correct: false, confidence: 0.2, message: 'Only one hand detected', tip: 'Place BOTH hands on your lap. This mudra needs two hands with thumbs touching.' };
  }

  return { correct: false, confidence: 0.2, message: 'Show both hands to camera', tip: 'Rest both hands on your lap, palms up, and touch thumb tips.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Master analyzer — routes to correct mudra function
// ─────────────────────────────────────────────────────────────────────────────
export function analyzeMudra(mudraId, landmarks, allHands) {
  switch (mudraId) {
    case 'gyan':   return analyzeGyanMudra(landmarks);
    case 'prana':  return analyzePranaMudra(landmarks);
    case 'shuni':  return analyzeShiniMudra(landmarks);
    case 'dhyana': return analyzeDhyanaMudra(landmarks, allHands);
    default:       return { correct: false, confidence: 0, message: 'Unknown mudra', tip: '' };
  }
}
