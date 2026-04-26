gsap.registerPlugin(ScrollTrigger)

// Card colors
const colors = ['255,90,80', '80,200,120', '125,150,255', '225,150,225']

const tl = gsap.timeline({ defaults: { duration: 2 } })

	.set('.card', {
		backgroundColor: (i) => 'rgba(' + colors[gsap.utils.wrap(0, colors.length, i)] + ',0.7)',
		backgroundImage: (i, t, a) => (i == a.length - 1)
			? 'radial-gradient(ellipse at 330px 120px, rgba(0,0,0,0) 30%, #000 150%)'
			: 'radial-gradient(ellipse at 2500px -400px, rgba(0,0,0,0) 0%, #000 60%)',
		transformOrigin: '50% 999px -100px',
		'backdrop-filter': 'blur(20px)',
		x: '-50%',
		y: '-45%',
		z: -500,
		rotateX: 2
	})
	.to('.card', {
		z: 10,
		rotateX: -3,
		stagger: -1
	}, 0)
	.to('.card', {
		yPercent: 100,
		stagger: -1,
		ease: 'back.in(2)'
	}, 0)
	.to('.card', {
		duration: 1,
		'backdrop-filter': 'blur(8px)',
		backgroundImage: 'radial-gradient(ellipse at 150px 250px, rgba(0,0,0,0) 80%, #000 300%)',
		stagger: -1,
		ease: 'power3.in'
	}, 0)
	.to('.card', {
		duration: 1,
		'backdrop-filter': 'blur(1px)',
		backgroundImage: 'radial-gradient(ellipse at -1000px 500px, rgba(0,0,0,0) 0%, #000 50%)',
		stagger: -1,
		ease: 'sine.in'
	}, 1)
	.to('.card', {
		duration: 0.1,
		autoAlpha: 0,
		stagger: -1,
	}, 1.9)
	.pause(1)


// TIMELINE
gsap.timeline()
	.to('.carousel', { duration: 0.8, opacity: 1, ease: 'power2.inOut' })
	.fromTo(tl, {
		progress: 1
	}, {
		duration: 1.5,
		progress: 0.07,
		ease: 'expo',
		onComplete: initST
	}, 0)


// INIT
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
			scrub: 1,
		}
	})
}
