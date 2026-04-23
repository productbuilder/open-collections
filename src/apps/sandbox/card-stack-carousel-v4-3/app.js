gsap.registerPlugin(ScrollTrigger)

const cards = gsap.utils.toArray('.card')
const colors = ['255,90,80', '80,200,120', '125,150,255', '225,150,225']

const STACK_OFFSET = 90
const SCALE_STEP = 0.04
const EXIT_DISTANCE = 200

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

gsap.set(cards, {
  xPercent: -50,
  transformOrigin: '50% 50%',
  backgroundColor: (i) => `rgb(${colors[gsap.utils.wrap(0, colors.length, i)]})`
})

setStack()

const tl = gsap.timeline({ paused: true })

function buildStep() {
  const topCard = cards[0]

  tl.to(cards, {
    y: `-=${STACK_OFFSET}`,
    duration: 1,
    ease: 'power2.inOut'
  })

  tl.to(topCard, {
    y: `-=${EXIT_DISTANCE}`,
    duration: 1,
    ease: 'power3.in'
  }, '<')

  tl.call(() => {
    const first = cards.shift()
    cards.push(first)
    setStack()
  })
}

for (let i = 0; i < cards.length * 3; i++) {
  buildStep()
}

gsap.to(tl, {
  progress: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: 'main',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    pin: '.carousel'
  }
})
