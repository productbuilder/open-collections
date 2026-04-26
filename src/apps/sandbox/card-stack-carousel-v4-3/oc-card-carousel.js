// src/apps/sandbox/card-stack-carousel-v4-3/oc-card-carousel.js

const { gsap, ScrollTrigger } = window

gsap.registerPlugin(ScrollTrigger)

class OcCardCarousel extends HTMLElement {

	static get observedAttributes() {
		return ['scroll-vh-per-card']
	}

	constructor() {

		super()

		this.attachShadow({ mode: 'open' })

		this._cards = []
		this._cardElements = []
		this._motionState = { step: 0 }
		this._tl = null
		this._scrollTween = null

		this.scrollVhPerCard = Number(this.getAttribute('scroll-vh-per-card')) || 100

		this.colors = ['255,90,80', '80,200,120', '125,150,255', '225,150,225']

		this.exitTopYPercent = -200
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
          border-radius: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3rem;
          font-family: monospace;
          color: #fff;
          box-sizing: border-box;
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

		this.style.setProperty(
			'--oc-card-carousel-scroll-height',
			`${cardCount * this.scrollVhPerCard}vh`
		)

		const slotYPercent = this.createCurvedSlots(cardCount, 0, 53, 5)
		const slotZ = this.createCurvedSlots(cardCount, 16, -72, 2)
		const slotRotateX = this.createLinearSlots(cardCount, 0, 0)
		const blurBySlot = this.createCurvedSlots(cardCount, 8, 20, 2)

		const slotCount = slotYPercent.length
		const maxStep = cardCount

		this._motionState.step = 0

		const renderStackSlots = () => {
			const progressStep = this._motionState.step

			this._cardElements.forEach((cardElement, index) => {
				//const slotPosition = cardCount - 1 - index - progressStep
				const slotPosition = index - progressStep

				const yPercent = this.getInterpolatedSlotValue(
					slotPosition,
					slotYPercent,
					this.exitTopYPercent,
					this.entryBottomYPercent,
					slotCount
				)

				if (yPercent == null) {
					gsap.set(cardElement, { autoAlpha: 0 })
					return
				}

				const z = this.getInterpolatedSlotValue(slotPosition, slotZ, 28, -92, slotCount)
				const rotateX = this.getInterpolatedSlotValue(slotPosition, slotRotateX, -1.2, 8.2, slotCount)
				const blur = this.getInterpolatedSlotValue(slotPosition, blurBySlot, 2, 22, slotCount)

				gsap.set(cardElement, {
					yPercent,
					z,
					rotateX,
					autoAlpha: 1,
					backdropFilter: `blur(${blur}px)`,
					backgroundImage: 'none',
					zIndex: cardCount - index
				})
			})
		}

		this._tl = gsap.timeline({ defaults: { ease: 'none' } })
			.set(this._cardElements, {
				backgroundColor: (i) => `rgb(${this.colors[gsap.utils.wrap(0, this.colors.length, i)]})`,
				transformOrigin: '50% 120% -20px',
				x: '-50%',
				y: '0%'
			})
			.to(this._motionState, {
				step: maxStep,
				duration: maxStep,
				onUpdate: renderStackSlots
			}, 0)
			.pause(0)

		renderStackSlots()

		this._scrollTween = gsap.to(this._tl, {
			progress: 1,
			scrollTrigger: {
				trigger: this,
				start: 'top top',
				end: 'bottom bottom',
				scrub: true,
				pin: this.shadowRoot.querySelector('.carousel')
			}
		})
	}

	destroyAnimationsOnly() {
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

		if (position <= 0) {
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