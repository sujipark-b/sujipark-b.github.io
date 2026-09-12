(function () {
	'use strict';

	document.documentElement.classList.add('js');

	const SECTION_IDS = [
		'featured-project',
		'portfolio',
		'realtime-lab',
		'about'
	];

	const ACTIVATION_RATIO = 0.38;
	const VIGNETTE_GUARD_MS = 800;

	const sections = SECTION_IDS
		.map((id) => document.getElementById(id))
		.filter(Boolean);

	const navLinks = Array.from(
		document.querySelectorAll('.site-nav a[href^="#"]')
	);

	let currentTopLevelSectionId = null;
	let vignetteTimer = null;
	let scrollTicking = false;
	let activeTouchedCard = null;
	let isProgrammaticScrolling = false;
	let programmaticScrollFrame = null;
	let programmaticTargetSection = null;
	let lastVignetteSectionId = null;
	let lastVignetteTime = 0;

	const touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
	const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
	const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	const touchCardSelector = '.visual-card, .work-card, .cv-preview';

	function getCurrentSection() {
		const activationY = window.innerHeight * ACTIVATION_RATIO;

		for (const section of sections) {
			const rect = section.getBoundingClientRect();

			if (rect.top <= activationY && rect.bottom > activationY) {
				return section;
			}
		}

		return null;
	}

	function triggerSectionInteraction(section) {
		if (!section) {
			return;
		}

		section.classList.remove('section--interaction-active');
		void section.offsetWidth;
		section.classList.add('section--interaction-active');
	}

	function triggerSectionVignette(section, options) {
		const settings = options || {};

		if (!section) {
			return;
		}

		const now = performance.now();

		if (
			!settings.force &&
			lastVignetteSectionId === section.id &&
			now - lastVignetteTime < VIGNETTE_GUARD_MS
		) {
			return;
		}

		triggerSectionInteraction(section);

		lastVignetteSectionId = section.id;
		lastVignetteTime = now;

		document
			.querySelectorAll('.section--vignette-active')
			.forEach((item) => {
				item.classList.remove('section--vignette-active');
			});

		window.clearTimeout(vignetteTimer);

		void section.offsetWidth;
		section.classList.add('section--vignette-active');

		vignetteTimer = window.setTimeout(() => {
			section.classList.remove('section--vignette-active');
		}, 1250);
	}

	function triggerDestinationEffect(sectionId) {
		const section = sections.find((item) => item.id === sectionId);

		triggerSectionVignette(section, {
			force: true
		});
	}

	function updateTopLevelSection(nextSection, options) {
		const settings = options || {};
		const nextId = nextSection ? nextSection.id : null;
		const hasChanged = nextId !== currentTopLevelSectionId;

		if (!hasChanged && !settings.force) {
			return;
		}

		currentTopLevelSectionId = nextId;

		navLinks.forEach((link) => {
			const targetId = link.getAttribute('href').replace('#', '');
			const isActive = targetId === nextId;

			link.classList.toggle('is-active', isActive);

			if (isActive) {
				link.setAttribute('aria-current', 'page');
			} else {
				link.removeAttribute('aria-current');
			}
		});

		if (hasChanged && nextSection && !settings.suppressVignette) {
			triggerSectionVignette(nextSection);
		}
	}

	function handleScroll() {
		if (isProgrammaticScrolling) {
			return;
		}

		if (scrollTicking) {
			return;
		}

		scrollTicking = true;

		window.requestAnimationFrame(() => {
			updateTopLevelSection(getCurrentSection());
			scrollTicking = false;
		});
	}

	function syncFromHash() {
		if (isProgrammaticScrolling) {
			return;
		}

		const hashId = window.location.hash.replace('#', '');
		const section = sections.find((item) => item.id === hashId);

		if (!section) {
			handleScroll();
			return;
		}

		window.setTimeout(() => {
			const resolvedSection = getCurrentSection();
			updateTopLevelSection(resolvedSection || section);
		}, 80);
	}

	function clearTouchedCard() {
		if (!activeTouchedCard) {
			return;
		}

		activeTouchedCard.classList.remove('is-touched');
		activeTouchedCard = null;
	}

	function setTouchedCard(card) {
		if (activeTouchedCard && activeTouchedCard !== card) {
			activeTouchedCard.classList.remove('is-touched');
		}

		activeTouchedCard = card;
		activeTouchedCard.classList.add('is-touched');
	}

	function handleTouchCardInteraction(event) {
		if (!touchQuery.matches) {
			return;
		}

		const card = event.target.closest(touchCardSelector);

		if (!card) {
			clearTouchedCard();
			return;
		}

		setTouchedCard(card);
	}

	function handleTouchCapabilityChange() {
		if (!touchQuery.matches) {
			clearTouchedCard();
		}
	}

	function getScrollDuration(distance) {
		const absoluteDistance = Math.abs(distance);

		return Math.min(
			620,
			Math.max(260, absoluteDistance * 0.32)
		);
	}

	function easeOutCubic(progress) {
		return 1 - Math.pow(1 - progress, 3);
	}

	function cancelProgrammaticScroll(options) {
		const settings = options || {};

		if (!isProgrammaticScrolling && !programmaticScrollFrame) {
			return;
		}

		if (programmaticScrollFrame) {
			window.cancelAnimationFrame(programmaticScrollFrame);
			programmaticScrollFrame = null;
		}

		if (isProgrammaticScrolling) {
			document.documentElement.classList.remove('is-programmatic-scrolling');
		}

		isProgrammaticScrolling = false;
		programmaticTargetSection = null;

		if (!settings.skipActiveUpdate) {
			handleScroll();
		}
	}

	function finishProgrammaticScroll(target) {
		const targetId = target.id;

		programmaticScrollFrame = null;
		isProgrammaticScrolling = false;
		programmaticTargetSection = null;
		document.documentElement.classList.remove('is-programmatic-scrolling');

		updateTopLevelSection(target, {
			force: true,
			suppressVignette: true
		});
		triggerDestinationEffect(targetId);
	}

	function scrollToSection(target) {
		const startY = window.scrollY;
		const targetY = target.getBoundingClientRect().top + window.scrollY;
		const distance = targetY - startY;
		const duration = getScrollDuration(distance);
		const startTime = performance.now();

		function step(now) {
			if (!isProgrammaticScrolling || programmaticTargetSection !== target) {
				return;
			}

			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeOutCubic(progress);

			window.scrollTo({
				top: startY + distance * eased,
				left: 0,
				behavior: 'auto'
			});

			if (progress < 1) {
				programmaticScrollFrame = window.requestAnimationFrame(step);
				return;
			}

			finishProgrammaticScroll(target);
		}

		programmaticScrollFrame = window.requestAnimationFrame(step);
	}

	function navigateWithCappedMobileScroll(event, link, target) {
		event.preventDefault();

		cancelProgrammaticScroll({
			skipActiveUpdate: true
		});

		updateTopLevelSection(target, {
			force: true,
			suppressVignette: true
		});

		if (window.history && typeof window.history.replaceState === 'function') {
			window.history.replaceState(null, '', link.getAttribute('href'));
		}

		if (reducedMotionQuery.matches) {
			window.scrollTo({
				top: target.getBoundingClientRect().top + window.scrollY,
				left: 0,
				behavior: 'auto'
			});
			finishProgrammaticScroll(target);
			return;
		}

		isProgrammaticScrolling = true;
		programmaticTargetSection = target;
		document.documentElement.classList.add('is-programmatic-scrolling');
		scrollToSection(target);
	}

	function navigateWithNativeMobileScroll(event, link, target) {
		event.preventDefault();

		cancelProgrammaticScroll({
			skipActiveUpdate: true
		});

		updateTopLevelSection(target, {
			force: true,
			suppressVignette: true
		});

		if (window.history && typeof window.history.replaceState === 'function') {
			window.history.replaceState(null, '', link.getAttribute('href'));
		}

		target.scrollIntoView({
			behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
			block: 'start'
		});

		window.setTimeout(() => {
			updateTopLevelSection(getCurrentSection() || target, {
				force: true,
				suppressVignette: true
			});
			triggerDestinationEffect(target.id);
		}, reducedMotionQuery.matches ? 0 : 380);
	}



	function initPipelineLoop() {
		if (reducedMotionQuery.matches) {
			return;
		}

		const stages = Array.from(
			document.querySelectorAll('.experiment-stage .pipeline-flow')
		).map((flow) => flow.closest('.experiment-stage')).filter(Boolean);

		if (!stages.length) {
			return;
		}

		function playPipeline(stage) {
			stage.classList.remove('is-pipeline-playing');
			void stage.offsetWidth;
			stage.classList.add('is-pipeline-playing');
		}

		stages.forEach((stage) => {
			stage.addEventListener('pointerenter', () => {
				if (finePointerQuery.matches) {
					playPipeline(stage);
				}
			}, {
				passive: true
			});
		});

		if (!('IntersectionObserver' in window)) {
			stages.forEach(playPipeline);
			return;
		}

		const visibleState = new WeakMap();

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const wasVisible = visibleState.get(entry.target) || false;
				const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;

				if (isVisible && !wasVisible) {
					playPipeline(entry.target);
				}

				visibleState.set(entry.target, isVisible);
			});
		}, {
			threshold: [0, 0.35, 0.6]
		});

		stages.forEach((stage) => observer.observe(stage));
	}

	function initCustomCursor() {
		if (!finePointerQuery.matches || reducedMotionQuery.matches) {
			return;
		}

		const dot = document.createElement('div');
		const glow = document.createElement('div');
		const bloom = document.createElement('div');
		const interactiveSelector = 'a, button, .visual-card, .work-card, .cv-preview, .video-embed, .project-block--first > .media-frame';

		dot.className = 'custom-cursor-dot';
		glow.className = 'custom-cursor-glow';
		bloom.className = 'custom-cursor-bloom';
		dot.setAttribute('aria-hidden', 'true');
		glow.setAttribute('aria-hidden', 'true');
		bloom.setAttribute('aria-hidden', 'true');

		document.body.appendChild(bloom);
		document.body.appendChild(glow);
		document.body.appendChild(dot);
		document.documentElement.classList.add('has-custom-cursor');

		let pointerX = -100;
		let pointerY = -100;
		let glowX = -100;
		let glowY = -100;
		let bloomX = -100;
		let bloomY = -100;
		let animationFrame = null;

		function positionElement(element, x, y) {
			element.style.transform =
				'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -50%)';
		}

		function animateGlow() {
			glowX += (pointerX - glowX) * 0.18;
			glowY += (pointerY - glowY) * 0.18;
			bloomX += (pointerX - bloomX) * 0.095;
			bloomY += (pointerY - bloomY) * 0.095;
			positionElement(glow, glowX, glowY);
			positionElement(bloom, bloomX, bloomY);
			animationFrame = window.requestAnimationFrame(animateGlow);
		}

		function showCursor() {
			dot.classList.add('is-visible');
			glow.classList.add('is-visible');
			bloom.classList.add('is-visible');
		}

		function hideCursor() {
			dot.classList.remove('is-visible');
			glow.classList.remove('is-visible');
			glow.classList.remove('is-interactive');
			glow.classList.remove('is-blooming');
			glow.classList.remove('is-pressed');
			bloom.classList.remove('is-visible');
			bloom.classList.remove('is-interactive');
			bloom.classList.remove('is-blooming');
			bloom.classList.remove('is-pressed');
			dot.classList.remove('is-interactive');
		}

		window.addEventListener('pointermove', (event) => {
			pointerX = event.clientX;
			pointerY = event.clientY;
			positionElement(dot, pointerX, pointerY);
			showCursor();
		}, {
			passive: true
		});

		let currentInteractiveTarget = null;
		let bloomTimer = null;

		function triggerCursorBloom() {
			glow.classList.remove('is-blooming');
			bloom.classList.remove('is-blooming');
			void glow.offsetWidth;
			glow.classList.add('is-blooming');
			bloom.classList.add('is-blooming');

			window.clearTimeout(bloomTimer);
			bloomTimer = window.setTimeout(() => {
				glow.classList.remove('is-blooming');
				bloom.classList.remove('is-blooming');
			}, 760);
		}

		document.addEventListener('pointerover', (event) => {
			const interactiveTarget = event.target.closest
				? event.target.closest(interactiveSelector)
				: null;
			const isInteractive = Boolean(interactiveTarget);

			glow.classList.toggle('is-interactive', isInteractive);
			bloom.classList.toggle('is-interactive', isInteractive);
			dot.classList.toggle('is-interactive', isInteractive);

			if (interactiveTarget && interactiveTarget !== currentInteractiveTarget) {
				triggerCursorBloom();
			}

			currentInteractiveTarget = interactiveTarget;
		});

		document.addEventListener('pointerdown', () => {
			glow.classList.add('is-pressed');
			bloom.classList.add('is-pressed');
		}, {
			passive: true
		});

		document.addEventListener('pointerup', () => {
			glow.classList.remove('is-pressed');
			bloom.classList.remove('is-pressed');
		}, {
			passive: true
		});

		window.addEventListener('blur', hideCursor);
		document.documentElement.addEventListener('mouseleave', hideCursor);
		document.documentElement.addEventListener('mouseenter', showCursor);

		document.querySelectorAll('iframe').forEach((frame) => {
			frame.addEventListener('mouseenter', hideCursor);
			frame.addEventListener('mouseleave', showCursor);
		});

		animationFrame = window.requestAnimationFrame(animateGlow);

		window.addEventListener('pagehide', () => {
			if (animationFrame) {
				window.cancelAnimationFrame(animationFrame);
			}
		}, {
			once: true
		});
	}

	navLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			const target = document.querySelector(link.getAttribute('href'));

			if (!target) {
				return;
			}

			if (touchQuery.matches) {
				if (target.id === 'featured-project') {
					navigateWithNativeMobileScroll(event, link, target);
					return;
				}

				navigateWithCappedMobileScroll(event, link, target);
				return;
			}

			window.setTimeout(() => {
				updateTopLevelSection(getCurrentSection());
			}, 50);
		});
	});

	window.addEventListener('scroll', handleScroll, {
		passive: true
	});

	window.addEventListener('resize', handleScroll);
	window.addEventListener('hashchange', syncFromHash);
	window.addEventListener('wheel', cancelProgrammaticScroll, {
		passive: true
	});
	window.addEventListener('touchmove', cancelProgrammaticScroll, {
		passive: true
	});
	window.addEventListener('touchstart', cancelProgrammaticScroll, {
		passive: true
	});
	window.addEventListener('pointercancel', cancelProgrammaticScroll, {
		passive: true
	});

	document.addEventListener('pointerdown', handleTouchCardInteraction, {
		passive: true
	});

	document.addEventListener('pointerdown', (event) => {
		if (
			isProgrammaticScrolling &&
			!event.target.closest('.site-nav a')
		) {
			cancelProgrammaticScroll();
		}
	}, {
		passive: true
	});

	document.addEventListener('click', (event) => {
		if (window.PointerEvent) {
			return;
		}

		handleTouchCardInteraction(event);
	});

	if (typeof touchQuery.addEventListener === 'function') {
		touchQuery.addEventListener('change', handleTouchCapabilityChange);
	} else if (typeof touchQuery.addListener === 'function') {
		touchQuery.addListener(handleTouchCapabilityChange);
	}

	initPipelineLoop();
	initCustomCursor();

	window.addEventListener('load', () => {
		if (window.location.hash) {
			syncFromHash();
		} else {
			updateTopLevelSection(getCurrentSection(), { force: true });
		}
	});
}());
