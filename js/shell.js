/* ==========================================================================
   beeapp — application shell
   Fills the signed-in identity, keeps every balance on the page in sync,
   and drives the mobile navigation drawer.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;
	var CONCEAL_KEY = "beeapp.concealed";

	function each(selector, handler) {
		document.querySelectorAll(selector).forEach(handler);
	}

	function initials(profile) {
		return ((profile.firstName || "")[0] || "") + ((profile.lastName || "")[0] || "");
	}

	function fullName(profile) {
		return [profile.firstName, profile.lastName].filter(Boolean).join(" ");
	}

	function concealed() {
		try {
			return window.sessionStorage.getItem(CONCEAL_KEY) === "1";
		} catch (error) {
			return false;
		}
	}

	function setConcealed(value) {
		try {
			window.sessionStorage.setItem(CONCEAL_KEY, value ? "1" : "0");
		} catch (error) {
			/* ignore */
		}
	}

	function render() {
		var state = Bee.wallet.get();
		var profile = state.profile;
		var hide = concealed();

		each("[data-profile-name]", function (node) {
			node.textContent = fullName(profile);
		});

		each("[data-profile-handle]", function (node) {
			node.textContent = "@" + profile.handle;
		});

		each("[data-profile-initials]", function (node) {
			node.textContent = initials(profile).toUpperCase();
		});

		each("[data-wallet-number]", function (node) {
			node.textContent = state.wallet.number;
		});

		each("[data-copy-wallet]", function (node) {
			node.setAttribute("data-copy", state.wallet.number);
			node.setAttribute("data-copy-label", "Wallet number");
		});

		each("[data-balance-value]", function (node) {
			node.textContent = hide ? "••••••" : Bee.plain(state.balance);
		});

		each("[data-available]", function (node) {
			node.textContent = hide ? "₦••••••" : Bee.money(state.balance);
		});

		each("[data-pending]", function (node) {
			var pending = Bee.wallet.pending();
			node.textContent = hide ? "₦••••••" : Bee.money(pending);
		});

		each("[data-pending-row]", function (node) {
			node.hidden = Bee.wallet.pending() <= 0;
		});

		var used = Bee.wallet.usedToday();
		var limit = Bee.wallet.limit();
		var remaining = Math.max(0, limit - used);
		var share = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

		each("[data-limit-used]", function (node) {
			node.textContent = Bee.money(used);
		});

		each("[data-limit-total]", function (node) {
			node.textContent = Bee.money(limit);
		});

		each("[data-limit-remaining]", function (node) {
			node.textContent = Bee.money(remaining) + " remaining today";
		});

		each("[data-limit-bar]", function (node) {
			node.style.width = share + "%";
		});

		each("[data-balance-toggle]", function (button) {
			var active = concealed();
			button.setAttribute("aria-pressed", String(active));
			button.setAttribute("aria-label", active ? "Show balance" : "Hide balance");
			if (button.dataset.state !== String(active)) {
				button.dataset.state = String(active);
				button.innerHTML = Bee.ui.icon(active ? "eye-off" : "eye");
				Bee.ui.drawIcons();
			}
		});
	}

	function wireBalanceToggle() {
		each("[data-balance-toggle]", function (button) {
			button.addEventListener("click", function () {
				setConcealed(!concealed());
				render();
			});
		});
	}

	function wireCopy() {
		document.addEventListener("click", function (event) {
			var trigger = event.target.closest("[data-copy]");
			if (!trigger) return;
			var label = trigger.getAttribute("data-copy-label") || "Value";
			Bee.ui.copy(trigger.getAttribute("data-copy"), label + " copied");
		});
	}

	function wireDrawer() {
		var sidebar = document.querySelector(".sidebar");
		var scrim = document.querySelector(".scrim");
		var toggle = document.querySelector(".nav-toggle");
		if (!sidebar || !toggle) return;

		function close() {
			sidebar.classList.remove("is-open");
			scrim.hidden = true;
			toggle.setAttribute("aria-expanded", "false");
			document.body.classList.remove("nav-open");
		}

		function open() {
			sidebar.classList.add("is-open");
			scrim.hidden = false;
			toggle.setAttribute("aria-expanded", "true");
			document.body.classList.add("nav-open");
		}

		if (toggle) {
			toggle.addEventListener("click", function () {
				if (sidebar.classList.contains("is-open")) close();
				else open();
			});
		}

		if (scrim) scrim.addEventListener("click", close);

		document.addEventListener("keydown", function (event) {
			if (event.key === "Escape") close();
		});

		window.addEventListener("resize", function () {
			if (window.innerWidth > 960) close();
		});
	}

	function wireSignOut() {
		each("[data-signout]", function (button) {
			button.addEventListener("click", function (event) {
				event.preventDefault();
				Bee.session.end();
				window.location.href = "index.html";
			});
		});
	}

	function init() {
		render();
		wireBalanceToggle();
		wireCopy();
		wireDrawer();
		wireSignOut();
		Bee.ui.drawIcons();
		Bee.wallet.onChange(render);
	}

	Bee.shell = { init: init, render: render };

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window);
