gsap.registerPlugin(ScrollTrigger)

const cards = gsap.utils.toArray('.card')
const colors = ['#4f46e5', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981']

gsap.set(cards, {
  xPercent: -50,
  yPercent: -50,
  transformStyle: 'preserve-3d',
  transformOrigin: '50% 100%'
})

gsap.set(cards, {
  z: (_, i) => -i * 40,
  y: (_, i) => i * 16,
  rotateX: (_, i) => i * 2,
  scale: (_, i) => 1 - i * 0.03,
  backgroundColor: (_, i) => colors[i % colors.length],
  filter: 'blur(0px)',
  opacity: 1
})

const tl = gsap.timeline({ defaults: { duration: 2 } })

// (paste full provided GSAP code here unchanged)
tl
  .to('.arrow path', { attr: { d: 'M1,0 1,10' }, duration: 0.6, ease: 'power2.out' }, 0)
  .to('.arrow', { y: 16, repeat: 1, yoyo: true, duration: 0.8, ease: 'power1.inOut' }, 0)
  .to(cards, {
    y: (i) => -(i * 38),
    z: (i) => -i * 80,
    rotateX: (i) => i * 8,
    stagger: 0.08,
    ease: 'power2.inOut'
  }, 0)
  .to(cards, {
    scale: (i) => 1 - i * 0.09,
    filter: (i) => `blur(${Math.max(0, i - 1) * 1.1}px)`,
    stagger: 0.08,
    ease: 'power2.inOut'
  }, 1)
  .to(cards, {
    y: (i) => -140 - i * 85,
    z: (i) => -180 - i * 30,
    opacity: (i) => (i < 2 ? 0 : 1),
    stagger: 0.1,
    ease: 'power3.inOut'
  }, 2)
  .to(cards, {
    opacity: 0,
    stagger: 0.06,
    ease: 'power2.in'
  }, 3)

ScrollTrigger.create({
  animation: tl,
  trigger: 'main',
  start: 'top top',
  end: 'bottom bottom',
  scrub: true
})

gsap.to('.carousel', {
  duration: 0.8,
  opacity: 1,
  ease: 'power2.inOut'
})
