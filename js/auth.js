/* ==========================================================================
   beeapp — authentication
   Sign in, a three-step account creation, and a single password reset route
   that moves from identify → verify → new password.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;
	var signup = {};
	var resendTimer = null;

	function qs(selector) {
		return document.querySelector(selector);
	}

	function qsa(selector) {
		return Array.prototype.slice.call(document.querySelectorAll(selector));
	}

	function setError(key, message) {
		var node = qs('[data-error="' + key + '"]');
		var input = qs('[data-input="' + key + '"]');
		if (node) {
			node.textContent = message || "";
			node.hidden = !message;
		}
		if (input) {
			if (message) input.setAttribute("aria-invalid", "true");
			else input.removeAttribute("aria-invalid");
		}
	}

	function isPhone(value) {
		return /^0\d{10}$/.test(String(value).replace(/\s/g, ""));
	}

	function isEmail(value) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
	}

	function mask(value) {
		var text = String(value).trim();
		if (isEmail(text)) {
			var parts = text.split("@");
			var local = parts[0];
			return local.slice(0, 1) + "•••••" + local.slice(-1) + "@" + parts[1];
		}
		var digits = text.replace(/\D/g, "");
		return digits.slice(0, 4) + "•••" + digits.slice(-4);
	}

	function setStep(page, index) {
		qsa('[data-page="' + page + '"] [data-auth-step]').forEach(function (node) {
			node.hidden = Number(node.getAttribute("data-auth-step")) !== index;
		});

		qsa('[data-page="' + page + '"] [data-step-index]').forEach(function (node) {
			var position = Number(node.getAttribute("data-step-index"));
			node.classList.toggle("is-current", position === index);
			node.classList.toggle("is-done", position < index);
		});

		if (page === "signup" && index === 2) startResend(page);
		if (page === "reset" && index === 1) startResend(page);

		Bee.ui.drawIcons();
	}

	function startResend(page) {
		var button = qs('[data-page="' + page + '"] [data-resend]');
		if (!button) return;

		var remaining = 45;
		window.clearInterval(resendTimer);
		button.disabled = true;

		function tick() {
			button.textContent = "Resend code in 0:" + String(remaining).padStart(2, "0");
			if (remaining <= 0) {
				window.clearInterval(resendTimer);
				button.disabled = false;
				button.textContent = "Resend code";
				return;
			}
			remaining -= 1;
		}

		tick();
		resendTimer = window.setInterval(tick, 1000);

		button.onclick = function () {
			if (button.disabled) return;
			Bee.ui.toast("A new code is on its way");
			startResend(page);
		};
	}

	function passwordProblem(value) {
		if (String(value).length < 8) return "Use at least 8 characters.";
		if (!/[A-Z]/.test(value)) return "Include one capital letter.";
		if (!/[0-9]/.test(value)) return "Include one number.";
		return "";
	}

	function bindPasswordToggles() {
		qsa("[data-pw-toggle]").forEach(function (button) {
			var field = qs(button.getAttribute("data-pw-toggle"));
			if (!field) return;
			button.addEventListener("click", function () {
				var showing = field.getAttribute("type") === "text";
				field.setAttribute("type", showing ? "password" : "text");
				button.setAttribute("aria-pressed", String(!showing));
				button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
				button.innerHTML = Bee.ui.icon(showing ? "eye" : "eye-off");
				Bee.ui.drawIcons();
			});
		});
	}

	function bindStrength() {
		qsa("[data-strength]").forEach(function (field) {
			var rules = qs('[data-pw-rules="' + field.getAttribute("data-strength") + '"]');
			if (!rules) return;

			field.addEventListener("input", function () {
				var value = field.value;
				var checks = {
					length: value.length >= 8,
					upper: /[A-Z]/.test(value),
					number: /[0-9]/.test(value)
				};
				rules.querySelectorAll("[data-rule]").forEach(function (item) {
					item.classList.toggle("is-met", Boolean(checks[item.getAttribute("data-rule")]));
				});
			});
		});
	}

	/* ------------------------------------------------------------- sign in */

	function wireSignIn() {
		var page = qs('[data-page="signin"]');
		if (!page) return;
		var form = page.querySelector("form");

		form.addEventListener("submit", function (event) {
			event.preventDefault();
			var identifier = qs("#identifier").value.trim();
			var password = qs("#password").value;

			setError("identifier", "");
			setError("password", "");

			if (!identifier) {
				setError("identifier", "Enter your phone number or email address.");
				return;
			}
			if (!isPhone(identifier) && !isEmail(identifier)) {
				setError("identifier", "Enter a valid phone number or email address.");
				return;
			}
			if (!password) {
				setError("password", "Enter your password.");
				return;
			}

			var profile = {};
			if (isEmail(identifier)) profile.email = identifier;
			else profile.phone = identifier;

			Bee.session.start(profile);
			window.location.href = "dashboard.html";
		});
	}

	/* ---------------------------------------------------------------- signup */

	function wireSignUp() {
		var page = qs('[data-page="signup"]');
		if (!page) return;

		var detailsForm = qs("#signup-details");
		var passwordForm = qs("#signup-password");
		var verifyForm = qs("#signup-verify");

		qs("[data-back='1']").addEventListener("click", function () {
			setStep("signup", 0);
		});
		qs("[data-back='2']").addEventListener("click", function () {
			setStep("signup", 1);
		});

		detailsForm.addEventListener("submit", function (event) {
			event.preventDefault();

			var first = qs("#first-name").value.trim();
			var last = qs("#last-name").value.trim();
			var phone = qs("#signup-phone").value.replace(/\D/g, "");
			var email = qs("#signup-email").value.trim();

			setError("first", "");
			setError("last", "");
			setError("phone", "");
			setError("email", "");

			if (!first) return setError("first", "Enter your first name.");
			if (!last) return setError("last", "Enter your last name.");
			if (!isPhone(phone)) return setError("phone", "Enter an 11-digit phone number.");
			if (!isEmail(email)) return setError("email", "Enter a valid email address.");

			signup = { firstName: first, lastName: last, phone: phone, email: email };
			qs("[data-signup-mask]").textContent = mask(phone);
			setStep("signup", 1);
			qs("#signup-password-field").focus();
		});

		passwordForm.addEventListener("submit", function (event) {
			event.preventDefault();

			var password = qs("#signup-password-field").value;
			var confirm = qs("#signup-confirm").value;
			var problem = passwordProblem(password);

			setError("password", "");
			setError("confirm", "");

			if (problem) return setError("password", problem);
			if (password !== confirm) return setError("confirm", "The two passwords do not match.");

			signup.password = password;
			setStep("signup", 2);
			qs("#signup-otp").focus();
		});

		verifyForm.addEventListener("submit", function (event) {
			event.preventDefault();
			var code = qs("#signup-otp").value.replace(/\D/g, "");

			setError("otp", "");
			if (code.length !== 6) return setError("otp", "Enter the 6-digit code we sent you.");

			Bee.session.start({
				firstName: signup.firstName,
				lastName: signup.lastName,
				phone: signup.phone,
				email: signup.email,
				handle: (signup.firstName || "").toLowerCase().slice(0, 6) + String(Math.floor(Math.random() * 90) + 10)
			});

			window.location.href = "dashboard.html";
		});
	}

	/* ----------------------------------------------------------------- reset */

	function wireReset() {
		var page = qs('[data-page="reset"]');
		if (!page) return;

		var identifyForm = qs("#reset-identify");
		var verifyForm = qs("#reset-verify");
		var passwordForm = qs("#reset-password");
		var identifier = "";

		qs("[data-back='1']").addEventListener("click", function () {
			setStep("reset", 0);
		});
		qs("[data-back='2']").addEventListener("click", function () {
			setStep("reset", 1);
		});
		qs("[data-change-account]").addEventListener("click", function () {
			setStep("reset", 0);
		});

		identifyForm.addEventListener("submit", function (event) {
			event.preventDefault();
			identifier = qs("#reset-identifier").value.trim();
			setError("identifier", "");

			if (!isPhone(identifier) && !isEmail(identifier)) {
				return setError("identifier", "Enter the phone number or email address on your account.");
			}

			qs("[data-reset-mask]").textContent = mask(identifier);
			setStep("reset", 1);
			qs("#reset-otp").focus();
		});

		verifyForm.addEventListener("submit", function (event) {
			event.preventDefault();
			var code = qs("#reset-otp").value.replace(/\D/g, "");
			setError("otp", "");
			if (code.length !== 6) return setError("otp", "Enter the 6-digit code we sent you.");
			setStep("reset", 2);
			qs("#new-password").focus();
		});

		passwordForm.addEventListener("submit", function (event) {
			event.preventDefault();
			var password = qs("#new-password").value;
			var problem = passwordProblem(password);
			setError("password", "");
			if (problem) return setError("password", problem);

			Bee.ui.toast("Password updated. Sign in with your new password.");
			window.setTimeout(function () {
				window.location.href = "index.html";
			}, 900);
		});

		qs("#reset-identifier").setAttribute("autocomplete", "username");
	}

	function init() {
		bindPasswordToggles();
		bindStrength();
		wireSignIn();
		wireSignUp();
		wireReset();
		Bee.ui.drawIcons();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window);
