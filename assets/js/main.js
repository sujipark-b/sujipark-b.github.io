(function () {
	'use strict';

	document.documentElement.classList.add('js');

	const SECTION_IDS = [
		'featured-project',
		'portfolio',
		'about'
	];

	const ACTIVATION_RATIO = 0.38;
	const MOBILE_SCROLL_DURATION = 720;

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

	const touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
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

	function triggerSectionVignette(section) {
		if (!section) {
			return;
		}

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

	function easeInOutCubic(progress) {
		if (progress < 0.5) {
			return 4 * progress * progress * progress;
		}

		return 1 - Math.pow(-2 * progress + 2, 3) / 2;
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
		programmaticScrollFrame = null;
		isProgrammaticScrolling = false;
		programmaticTargetSection = null;
		document.documentElement.classList.remove('is-programmatic-scrolling');

		updateTopLevelSection(target, {
			force: true,
			suppressVignette: true
		});
		triggerSectionVignette(target);
	}

	function scrollToSection(target, duration) {
		const startY = window.scrollY;
		const targetY = target.getBoundingClientRect().top + window.scrollY;
		const distance = targetY - startY;
		const startTime = performance.now();

		function step(now) {
			if (!isProgrammaticScrolling || programmaticTargetSection !== target) {
				return;
			}

			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const eased = easeInOutCubic(progress);

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

		if (window.history && typeof window.history.pushState === 'function') {
			window.history.pushState(null, '', link.getAttribute('href'));
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
		scrollToSection(target, MOBILE_SCROLL_DURATION);
	}

	navLinks.forEach((link) => {
		link.addEventListener('click', (event) => {
			const target = document.querySelector(link.getAttribute('href'));

			if (!target) {
				return;
			}

			if (touchQuery.matches) {
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

	window.addEventListener('load', () => {
		if (window.location.hash) {
			syncFromHash();
		} else {
			updateTopLevelSection(getCurrentSection(), { force: true });
		}
	});
}());
