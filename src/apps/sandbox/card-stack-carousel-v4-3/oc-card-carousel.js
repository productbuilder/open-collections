// src/apps/sandbox/card-stack-carousel-v4-3/oc-card-carousel.js

const { gsap, ScrollTrigger, ScrollToPlugin } = window

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

class OcCardCarousel extends HTMLElement {

	static get observedAttributes() {
		return ['scroll-vh-per-card', 'max-visible-cards', 'scroll-mode', 'stack-height']
	}

	constructor() {

		super()

		this.attachShadow({ mode: 'open' })



		this._cards = []
		this._cardElements = []
		this._motionState = { step: 0 }
		this._tl = null
		this._scrollTween = null
		this._scrollTrigger = null

		// scroll mode
		this._currentStep = 0
		this._isAnimatingStep = false
		this._queuedStepDelta = 0
		this._wheelSnapTargetStep = 0
		this._wheelSnapTimeout = null
		this._wheelSnapTween = null
		this._touchStartY = 0
		this._removeStepInputHandlers = null



		// attributes
		this.scrollVhPerCard = Number(this.getAttribute('scroll-vh-per-card')) || 100;
		this.maxVisibleCards = Number(this.getAttribute('max-visible-cards')) || 30;
		this.scrollMode = this.getAttribute('scroll-mode') || 'continuous';
		this.stackHeight = Number(this.getAttribute('stack-height')) || 50


		this.colors = ['255,255,255', '255,255,120', '125,150,255', '225,150,225']

		this.exitTopYPercent = -120
		this.entryBottomYPercent = 74
		this.hiddenBelowYPercent = 50


	}

	connectedCallback() {
		this.render()
		this.setup()
	}

	disconnectedCallback() {
		this.destroy()
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue === newValue) return

		if (name === 'scroll-vh-per-card') {
			this.scrollVhPerCard = Number(newValue) || 100
			this.setup()
		}

		if (name === 'max-visible-cards') {
			this.maxVisibleCards = Number(newValue) || 30
			this.setup()
		}

		if (name === 'scroll-mode') {
			this.scrollMode = newValue || 'continuous'
			this.setup()
		}
	}

	set cards(value) {
		this._cards = Array.isArray(value) ? value : []
		this.render()
		this.setup()
	}

	get cards() {
		return this._cards
	}

	render() {

		this.shadowRoot.innerHTML = `
      <style>
        :host {
			display: block;
			width: 100%;
			 height: var(--oc-card-carousel-scroll-height, 700vh);
		}

        .carousel {
          position: relative;
          width: 100vw;
          height: 100vh;
          perspective: 360px;
          overflow: hidden;
          opacity: 1;
        }

        .card {
          position: absolute;
          left: 50%;
          top: 8vw;
          width: min(84vw, 740px);
          aspect-ratio: 2 / 1;
          max-height: 46vh;
          border-radius: 0.5rem;
		  border: 1px solid #ccc;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3rem;
          font-family: monospace;
          /* color: #00000000; */
          box-sizing: border-box;
		  background: #fff;
        }
      </style>

      <div class="carousel">
        ${this._cards.map((card, index) => this.renderCard(card, index)).join('')}
      </div>
    `
	}

	renderCard(card, index) {
		return `
			<div class="card" data-card-index="${index}">
				${card.title ?? card.label ?? card.id ?? index + 1}
			</div>
		`;
	}

	setup() {
		this.destroyAnimationsOnly()

		this._cardElements = Array.from(this.shadowRoot.querySelectorAll('.card'))

		if (!this._cardElements.length) return

		const cardCount = this._cardElements.length
		const maxStep = Math.max(0, cardCount - 1)

		const scrollPxPerCard = window.innerHeight * (this.scrollVhPerCard / 100)
		const scrollDistance = Math.max(1, maxStep * scrollPxPerCard)

		this.style.setProperty(
			'--oc-card-carousel-scroll-height',
			`${scrollDistance + window.innerHeight}px`
		)

		const visibleStackCount = Math.min(cardCount, this.maxVisibleCards)
		const visibleSlotCount = Math.min(cardCount, this.maxVisibleCards + 1)

		const isMobile = window.matchMedia('(max-width: 768px)').matches
		const maxBlur = isMobile ? 0 : 8

		const slotYPercent = this.createCurvedSlots(visibleSlotCount, 0,  this.stackHeight, 5) 
		const slotZ = this.createCurvedSlots(visibleSlotCount, 16, -72, 2)
		const slotRotateX = this.createLinearSlots(visibleSlotCount, 0, 0)
		const blurBySlot = this.createCurvedSlots(visibleSlotCount, 0, maxBlur, 2)

		const slotCount = visibleSlotCount


		this._motionState.step = 0

		const renderStackSlots = () => {

			const progressStep = this._motionState.step

			this._cardElements.forEach((cardElement, index) => {

				const distanceFromCurrent = index - progressStep

				if (distanceFromCurrent < -1 || distanceFromCurrent >= visibleStackCount) {
					gsap.set(cardElement, {
						autoAlpha: 0,
						pointerEvents: 'none'
					})
					return
				}

				const slotPosition = index - progressStep

				const yPercent = this.getInterpolatedSlotValue(
					slotPosition,
					slotYPercent,
					this.exitTopYPercent,
					this.entryBottomYPercent,
					slotCount
				)

				if (yPercent == null) {
					gsap.set(cardElement, { autoAlpha: 0, pointerEvents: 'none' })
					return
				}

				const z = this.getInterpolatedSlotValue(slotPosition, slotZ, 28, -92, slotCount)
				const rotateX = this.getInterpolatedSlotValue(slotPosition, slotRotateX, -1.2, 8.2, slotCount)
				const blur = this.getInterpolatedSlotValue(slotPosition, blurBySlot, 0, maxBlur, slotCount)

				gsap.set(cardElement, {
					yPercent,
					z,
					rotateX,
					autoAlpha: 1,
					pointerEvents: 'auto',
					filter: `blur(${blur}px)`,
					backdropFilter: 'none',
					backgroundImage: 'none',
					zIndex: this.maxVisibleCards - Math.floor(distanceFromCurrent)
				})
			})
		}

		this._tl = gsap.timeline({ defaults: { ease: 'none' } })
			.set(this._cardElements, {
				//backgroundColor: (i) => `rgb(${this.colors[gsap.utils.wrap(0, this.colors.length, i)]})`,
				transformOrigin: '50% 120% -20px',
				x: '-50%',
				y: '0%'
			})
			.to(this._motionState, {
				step: maxStep,
				duration: Math.max(1, maxStep),
				onUpdate: renderStackSlots
			}, 0)
			.pause(0)

		renderStackSlots()

		this._currentStep = 0

		const pinElement = this.shadowRoot.querySelector('.carousel')

		if (this.scrollMode === 'step') {
			// step mode
			this._scrollTrigger = ScrollTrigger.create({
				trigger: this,
				start: 'top top',
				end: `+=${scrollDistance}`,
				pin: pinElement,
				invalidateOnRefresh: true,
				onUpdate: (self) => {
					const step = self.progress * maxStep
					this._tl.progress(maxStep === 0 ? 0 : step / maxStep)
				}
			})

			this.addStepInputHandlers(maxStep, scrollPxPerCard)
		} else if (this.scrollMode === 'wheel-snap') {
			// hybrid snap step mode
			this._scrollTrigger = ScrollTrigger.create({
				trigger: this,
				start: 'top top',
				end: `+=${scrollDistance}`,
				pin: pinElement,
				invalidateOnRefresh: true,
				onUpdate: (self) => {
					const step = self.progress * maxStep
					this._tl.progress(maxStep === 0 ? 0 : step / maxStep)
				}
			})

			this.addWheelSnapInputHandlers(maxStep, scrollPxPerCard)
		} else {
			// existing continuous / snap mode
			const snapConfig = this.scrollMode === 'snap' && maxStep > 0
				? {
					snapTo: 1 / maxStep,
					duration: { min: 0.03, max: 0.08 },
					delay: 0.00,
					ease: 'power2.out'
				}
				: false

			this._scrollTween = gsap.to(this._tl, {
				progress: 1,
				ease: 'none',
				scrollTrigger: {
					trigger: this,
					start: 'top top',
					end: `+=${scrollDistance}`,
					//scrub: this.scrollMode === 'snap' ? 0.15 : true,
					scrub: true,
					pin: pinElement,
					invalidateOnRefresh: true,
					snap: snapConfig
				}
			})
		}

	}

	addStepInputHandlers(maxStep, scrollPxPerCard) {
		const carousel = this.shadowRoot.querySelector('.carousel')

		const goByStep = (delta) => {
			if (!delta) return

			const direction = delta > 0 ? 1 : -1

			if (this._isAnimatingStep) {
				this._queuedStepDelta += direction
				this._queuedStepDelta = gsap.utils.clamp(-5, 5, this._queuedStepDelta) // increase this if you want more momentum: this._queuedStepDelta = gsap.utils.clamp(-10, 10, this._queuedStepDelta)
				return
			}

			const nextStep = gsap.utils.clamp(
				0,
				maxStep,
				this._currentStep + direction
			)

			if (nextStep === this._currentStep) return

			this._currentStep = nextStep
			this._isAnimatingStep = true

			const targetScroll = this._scrollTrigger.start + nextStep * scrollPxPerCard

			gsap.to(window, {
				scrollTo: targetScroll,
				duration: 0.28,
				ease: 'power2.out',
				onComplete: () => {
					this._tl.progress(maxStep === 0 ? 0 : nextStep / maxStep)
					this._isAnimatingStep = false

					if (this._queuedStepDelta !== 0) {
						const queuedDirection = this._queuedStepDelta > 0 ? 1 : -1
						this._queuedStepDelta -= queuedDirection
						goByStep(queuedDirection)
					}
				}
			})
		}

		const onWheel = (event) => {
			event.preventDefault()

			const direction = event.deltaY > 0 ? 1 : -1
			goByStep(direction)
		}

		const onTouchStart = (event) => {
			this._touchStartY = event.touches[0].clientY
		}

		const onTouchEnd = (event) => {
			const touchEndY = event.changedTouches[0].clientY
			const deltaY = this._touchStartY - touchEndY

			if (Math.abs(deltaY) < 20) return

			const direction = deltaY > 0 ? 1 : -1
			goByStep(direction)
		}

		carousel.addEventListener('wheel', onWheel, { passive: false })
		carousel.addEventListener('touchstart', onTouchStart, { passive: true })
		carousel.addEventListener('touchend', onTouchEnd, { passive: true })

		this._removeStepInputHandlers = () => {
			carousel.removeEventListener('wheel', onWheel)
			carousel.removeEventListener('touchstart', onTouchStart)
			carousel.removeEventListener('touchend', onTouchEnd)
		}
	}

	addWheelSnapInputHandlers(maxStep, scrollPxPerCard) {
		const carousel = this.shadowRoot.querySelector('.carousel')

		const getStepFromScroll = () => {
			if (!this._scrollTrigger) return this._currentStep

			const rawStep = (window.scrollY - this._scrollTrigger.start) / scrollPxPerCard
			return gsap.utils.clamp(0, maxStep, Math.round(rawStep))
		}

		const goToTargetStep = () => {
			this._wheelSnapTargetStep = gsap.utils.clamp(
				0,
				maxStep,
				Math.round(this._wheelSnapTargetStep)
			)

			const targetScroll = this._scrollTrigger.start + this._wheelSnapTargetStep * scrollPxPerCard

			if (this._wheelSnapTween) {
				this._wheelSnapTween.kill()
			}

			this._wheelSnapTween = gsap.to(window, {
				scrollTo: targetScroll,
				duration: 0.32,		//  duration: 0.42,
				ease: 'power2.out', //ease: 'power3.out',
				overwrite: true,
				onComplete: () => {
					this._currentStep = this._wheelSnapTargetStep
					this._tl.progress(maxStep === 0 ? 0 : this._currentStep / maxStep)
					this._wheelSnapTween = null
				}
			})
		}

		const queueDirection = (direction) => {
			if (!direction) return

			this._wheelSnapTargetStep = gsap.utils.clamp(
				0,
				maxStep,
				this._wheelSnapTargetStep + direction
			)

			if (this._wheelSnapTimeout) {
				clearTimeout(this._wheelSnapTimeout)
			}

			this._wheelSnapTimeout = setTimeout(() => {
				goToTargetStep()
			}, 70)
		}

		const onWheel = (event) => {
			event.preventDefault()

			const direction = event.deltaY > 0 ? 1 : -1
			queueDirection(direction)
		}

		const onTouchStart = (event) => {
			this._touchStartY = event.touches[0].clientY
			this._wheelSnapTargetStep = getStepFromScroll()

			if (this._wheelSnapTween) {
				this._wheelSnapTween.kill()
				this._wheelSnapTween = null
			}
		}

		const onTouchMove = (event) => {
			event.preventDefault()
		}

		const onTouchEnd = (event) => {
			const touchEndY = event.changedTouches[0].clientY
			const deltaY = this._touchStartY - touchEndY

			if (Math.abs(deltaY) < 20) {
				goToTargetStep()
				return
			}

			const cardHeightForGesture = window.innerHeight * 0.16  // Smaller value = more cards per swipe: higher value less cards per swipe

			const stepDelta = gsap.utils.clamp(
				-8,
				8,
				Math.round(deltaY / cardHeightForGesture)
			)

			this._wheelSnapTargetStep = gsap.utils.clamp(
				0,
				maxStep,
				getStepFromScroll() + stepDelta
			)

			goToTargetStep()
		}

		this._wheelSnapTargetStep = this._currentStep

		carousel.addEventListener('wheel', onWheel, { passive: false })
		carousel.addEventListener('touchstart', onTouchStart, { passive: true })
		carousel.addEventListener('touchmove', onTouchMove, { passive: false })
		carousel.addEventListener('touchend', onTouchEnd, { passive: true })

		this._removeStepInputHandlers = () => {
			carousel.removeEventListener('wheel', onWheel)
			carousel.removeEventListener('touchstart', onTouchStart)
			carousel.removeEventListener('touchmove', onTouchMove)
			carousel.removeEventListener('touchend', onTouchEnd)

			if (this._wheelSnapTimeout) {
				clearTimeout(this._wheelSnapTimeout)
				this._wheelSnapTimeout = null
			}

			if (this._wheelSnapTween) {
				this._wheelSnapTween.kill()
				this._wheelSnapTween = null
			}
		}
	}

	destroyAnimationsOnly() {
		if (this._removeStepInputHandlers) {
			this._removeStepInputHandlers()
			this._removeStepInputHandlers = null
		}

		if (this._scrollTrigger) {
			this._scrollTrigger.kill()
			this._scrollTrigger = null
		}

		if (this._scrollTween) {
			this._scrollTween.kill()
			this._scrollTween = null
		}

		if (this._tl) {
			this._tl.kill()
			this._tl = null
		}
	}

	destroy() {
		this.destroyAnimationsOnly()

		ScrollTrigger.getAll().forEach((trigger) => {
			if (trigger.trigger === this) {
				trigger.kill()
			}
		})
	}

	createLinearSlots(count, start, end) {
		return Array.from({ length: count }, (_, i) => {
			const progress = count <= 1 ? 0 : i / (count - 1)
			return start + (end - start) * progress
		})
	}

	createCurvedSlots(count, start, end, power = 4) {
		return Array.from({ length: count }, (_, i) => {
			const progress = count <= 1 ? 0 : i / (count - 1)
			const curvedProgress = 1 - Math.pow(1 - progress, power)
			return start + (end - start) * curvedProgress
		})
	}

	lerp(start, end, progress) {
		return start + (end - start) * progress
	}

	getInterpolatedSlotValue(position, values, beforeValue, afterValue, slotCount) {
		if (position < -1 || position > slotCount + 1) return null

		if (position < 0) {
			const p = gsap.utils.clamp(0, 1, position + 1)
			return this.lerp(beforeValue, values[0], p)
		}

		if (position >= slotCount - 1) {
			if (position <= slotCount) {
				const p = position - (slotCount - 1)
				return this.lerp(values[slotCount - 1], afterValue, p)
			}

			const p = gsap.utils.clamp(0, 1, position - slotCount)
			return this.lerp(afterValue, this.hiddenBelowYPercent, p)
		}

		const lowerSlot = Math.floor(position)
		const p = position - lowerSlot

		return this.lerp(values[lowerSlot], values[lowerSlot + 1], p)
	}
}

if (!customElements.get('oc-card-carousel')) {
	customElements.define('oc-card-carousel', OcCardCarousel)
}