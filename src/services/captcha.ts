export interface CaptchaChallenge {
  left: number
  right: number
  operator: '+' | '-'
  result: number
}

function randomOperand(random: () => number): number {
  return Math.floor(random() * 9) + 1
}

export function createCaptcha(random: () => number = Math.random): CaptchaChallenge {
  let left = randomOperand(random)
  let right = randomOperand(random)
  const operator = random() < 0.5 ? '+' : '-'

  if (operator === '-' && left < right) {
    ;[left, right] = [right, left]
  }

  return {
    left,
    right,
    operator,
    result: operator === '+' ? left + right : left - right,
  }
}

export function validateCaptcha(challenge: CaptchaChallenge, answer: string): boolean {
  const normalizedAnswer = answer.trim()
  if (!/^\d+$/u.test(normalizedAnswer)) return false

  return Number(normalizedAnswer) === challenge.result
}
