const cards = Array.from(document.querySelectorAll('.card'))
const main = document.querySelector('main')
const arrow = document.querySelector('.arrow')

const colors = ['255,90,80', '80,200,120', '125,150,255', '225,150,225']
const clamp01 = (n) => Math.min(1, Math.max(0, n))
const smoothStep = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1))
  return t * t * (3 - 2 * t)
}

let progress = 0
let ticking = false

function getScrollProgress() {
  const maxScroll = Math.max(1, main.scrollHeight - window.innerHeight)
  return clamp01(window.scrollY / maxScroll)
}

function render() {
  const cardCount = cards.length
  const timelineSpan = 1.08
  const stagger = 0.092

  cards.forEach((card, index) => {
    const reverseIndex = cardCount - 1 - index
    const cardPhase = progress * timelineSpan + reverseIndex * stagger

    const appear = smoothStep(0, 0.17, cardPhase)
    const lift = smoothStep(0.12, 0.82, cardPhase)
    const blurPhase = smoothStep(0.32, 0.92, cardPhase)
    const fade = smoothStep(0.72, 1.02, cardPhase)

    const z = -500 + 530 * appear - 42 * fade
    const rotateX = 2 - 5 * appear + 1.3 * fade
    const y = -45 + 103 * lift - 36 * fade

    const blur = 20 - 12 * blurPhase - 7 * fade
    const opacity = 1 - fade

    const bgX = 2500 - 3500 * blurPhase - 1400 * fade
    const bgY = -400 + 720 * blurPhase + 260 * fade
    const vignette = 60 - 8 * blurPhase - 4 * fade

    card.style.backgroundColor = `rgba(${colors[index % colors.length]},0.7)`
    card.style.backgroundImage = `radial-gradient(ellipse at ${bgX}px ${bgY}px, rgba(0,0,0,0) 0%, #000 ${vignette}%)`
    card.style.transformOrigin = '50% 999px -100px'
    card.style.transform = `translate3d(-50%, ${y}%, ${z}px) rotateX(${rotateX}deg)`
    card.style.filter = `blur(${Math.max(0.4, blur).toFixed(2)}px)`
    card.style.opacity = opacity.toFixed(3)
    card.style.visibility = opacity <= 0.02 ? 'hidden' : 'visible'
  })

  arrow.style.opacity = (1 - smoothStep(0, 0.018, progress)).toFixed(3)
}

function update() {
  progress = getScrollProgress()
  ticking = false
  render()
}

function onScroll() {
  if (ticking) return
  ticking = true
  window.requestAnimationFrame(update)
}

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', onScroll)

progress = getScrollProgress()
render()
