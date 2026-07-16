(function () {
	'use strict';

	document.documentElement.classList.add('js');

	const SECTION_IDS = [
		'featured-project',
		'portfolio',
		'about'
	];

	const ACTIVATION_RATIO = 0.38;

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

	const touchQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
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

		if (hasChanged && nextSection) {
			triggerSectionVignette(nextSection);
		}
	}

	function handleScroll() {
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

	navLinks.forEach((link) => {
		link.addEventListener('click', () => {
			const target = document.querySelector(link.getAttribute('href'));

			if (!target) {
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
	document.addEventListener('pointerdown', handleTouchCardInteraction, {
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
