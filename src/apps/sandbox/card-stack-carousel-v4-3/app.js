gsap.registerPlugin(ScrollTrigger)

const cards = gsap.utils.toArray('.card')
const colors = ['255,90,80', '80,200,120', '125,150,255', '225,150,225']

const STACK_OFFSET = 90
const SCALE_STEP = 0.04
const SLOT_COUNT = cards.length
const LOOP_DISTANCE = SLOT_COUNT

const motionState = { shift: 0 }

function normalizeSlotPosition(rawPosition) {
  let normalized = rawPosition

  while (normalized < -1) normalized += SLOT_COUNT
  while (normalized >= SLOT_COUNT) normalized -= SLOT_COUNT

  return normalized
}

function getScaleForPosition(position) {
  const clampedPosition = gsap.utils.clamp(-1, SLOT_COUNT - 1, position)
  return 1 - clampedPosition * SCALE_STEP
}

function getZForPosition(position) {
  return Math.round((SLOT_COUNT - position) * 10)
}

function setStack() {
  cards.forEach((card, i) => {
    gsap.set(card, {
      y: i * STACK_OFFSET,
      scale: 1 - i * SCALE_STEP,
      zIndex: cards.length - i,
      opacity: 1,
      rotateX: 0
    })
  })
}

function renderStack() {
  const shift = motionState.shift

  cards.forEach((card, index) => {
    const slotPosition = normalizeSlotPosition(index - shift)

    gsap.set(card, {
      y: slotPosition * STACK_OFFSET,
      scale: getScaleForPosition(slotPosition),
      zIndex: getZForPosition(slotPosition),
      opacity: 1,
      rotateX: 0,
      yPercent: 0,
      autoAlpha: 1
    })
  })
}

setStack()

const stackTimeline = gsap.timeline({ defaults: { ease: 'none' } })
  .set('.card', {
    backgroundColor: (i) => `rgb(${colors[gsap.utils.wrap(0, colors.length, i)]})`,
    transformOrigin: '50% 50%',
    x: '-50%'
  })
  .to(motionState, {
    shift: LOOP_DISTANCE,
    duration: LOOP_DISTANCE,
    repeat: -1,
    onUpdate: renderStack
  }, 0)
  .pause(0)

renderStack()

gsap.timeline()
  .to('.carousel', { duration: 0.8, opacity: 1, ease: 'power2.inOut' })
  .fromTo(stackTimeline, {
    progress: 0
  }, {
    duration: 1.5,
    progress: 0.07,
    ease: 'expo',
    onComplete: initST
  }, 0)

function initST() {
  gsap.set('body', { overflow: 'scroll' })
  gsap.to(stackTimeline, {
    totalProgress: 1,
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
