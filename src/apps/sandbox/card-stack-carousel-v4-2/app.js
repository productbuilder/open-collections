gsap.registerPlugin(ScrollTrigger)

const colors = ['255,90,80', '80,200,120', '125,150,255', '225,150,225']
const SLOT_Y_PERCENT = [-6, 11, 26, 40, 53]
const SLOT_Z = [16, -6, -28, -50, -72]
const SLOT_ROTATE_X = [0, 2.2, 3.7, 5.2, 6.7]
const EXIT_TOP_YPERCENT = -170
const ENTRY_BOTTOM_YPERCENT = 74
const HIDDEN_BELOW_YPERCENT = 108
const BLUR_BY_SLOT = [8, 12, 15, 18, 20]

const cards = gsap.utils.toArray('.card')
const slotCount = SLOT_Y_PERCENT.length
const maxStep = cards.length
const motionState = { step: 0 }

const lerp = (start, end, progress) => start + (end - start) * progress

function getInterpolatedSlotValue(position, values, beforeValue, afterValue) {
  if (position < -1 || position > slotCount + 1) return null

  if (position <= 0) {
    const p = gsap.utils.clamp(0, 1, position + 1)
    return lerp(beforeValue, values[0], p)
  }

  if (position >= slotCount - 1) {
    if (position <= slotCount) {
      const p = position - (slotCount - 1)
      return lerp(values[slotCount - 1], afterValue, p)
    }

    const p = gsap.utils.clamp(0, 1, position - slotCount)
    return lerp(afterValue, HIDDEN_BELOW_YPERCENT, p)
  }

  const lowerSlot = Math.floor(position)
  const p = position - lowerSlot
  return lerp(values[lowerSlot], values[lowerSlot + 1], p)
}

function renderStackSlots() {
  const progressStep = motionState.step

  cards.forEach((card, index) => {
    const slotPosition = index - progressStep
    const yPercent = getInterpolatedSlotValue(
      slotPosition,
      SLOT_Y_PERCENT,
      EXIT_TOP_YPERCENT,
      ENTRY_BOTTOM_YPERCENT
    )

    if (yPercent == null) {
      gsap.set(card, { autoAlpha: 0 })
      return
    }

    const z = getInterpolatedSlotValue(slotPosition, SLOT_Z, 28, -92)
    const rotateX = getInterpolatedSlotValue(slotPosition, SLOT_ROTATE_X, -1.2, 8.2)
    const blur = getInterpolatedSlotValue(slotPosition, BLUR_BY_SLOT, 2, 22)

    gsap.set(card, {
      yPercent,
      z,
      rotateX,
      autoAlpha: 1,
      backdropFilter: `blur(${blur}px)`,
      backgroundImage: 'none'
    })
  })
}

const tl = gsap.timeline({ defaults: { ease: 'none' } })
  .set('.card', {
    backgroundColor: (i) => `rgb(${colors[gsap.utils.wrap(0, colors.length, i)]})`,
    transformOrigin: '50% 120% -20px',
    x: '-50%',
    y: '0%'
  })
  .to(motionState, {
    step: maxStep,
    duration: maxStep,
    onUpdate: renderStackSlots
  }, 0)
  .pause(0)

renderStackSlots()

gsap.timeline()
  .to('.carousel', { duration: 0.8, opacity: 1, ease: 'power2.inOut' })
  .fromTo(tl, {
    progress: 0
  }, {
    duration: 1.5,
    progress: 0.07,
    ease: 'expo',
    onComplete: initST
  }, 0)

function initST() {
  gsap.set('body', { overflow: 'scroll' })
  gsap.to(tl, {
    progress: 1,
    scrollTrigger: {
      trigger: 'main',
      start: '0 0',
      end: '100% 100%',
      scrub: true,
      pin: '.carousel'
    }
  })

  gsap.timeline({ repeat: -1, repeatDelay: 0.5 })
    .to('.arrow path', { attr: { d: 'M0,0 0,10' }, ease: 'power3.inOut' })
    .to('.arrow path', { attr: { d: 'M0,10 0,10' }, ease: 'power3.inOut' })

  gsap.to('.arrow', {
    opacity: 0,
    scrollTrigger: {
      trigger: 'main',
      start: '0 0',
      end: '9px 0',
      scrub: 1
    }
  })
}
