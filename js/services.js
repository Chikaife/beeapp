/* ==========================================================================
   beeapp — services
   Airtime, data, bill payments and betting wallet funding.
   Select a service, fill its fields, review, then pay from the wallet.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;

	var NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"];

	var DENOMINATIONS = [100, 200, 500, 1000, 2000, 5000];

	var DATA_PLANS = [
		{ name: "1.5GB", meta: "30 days", price: 1000 },
		{ name: "10GB", meta: "30 days", price: 4500 },
		{ name: "25GB", meta: "30 days", price: 9500 },
		{ name: "60GB", meta: "30 days", price: 20000 }
	];

	var BILLERS = [
		{
			id: "dstv",
			name: "DStv",
			label: "Smartcard number",
			packages: [
				{ name: "DStv Padi", meta: "1 month", price: 4400 },
				{ name: "DStv Yanga", meta: "1 month", price: 6000 },
				{ name: "DStv Compact", meta: "1 month", price: 19000 },
				{ name: "DStv Premium", meta: "1 month", price: 37000 }
			]
		},
		{
			id: "gotv",
			name: "GOtv",
			label: "IUC number",
			packages: [
				{ name: "GOtv Jinja", meta: "1 month", price: 3900 },
				{ name: "GOtv Jolli", meta: "1 month", price: 5800 },
				{ name: "GOtv Max", meta: "1 month", price: 8500 }
			]
		},
		{
			id: "ikedc",
			name: "Ikeja Electric",
			label: "Meter number",
			packages: [
				{ name: "₦2,500 prepaid", meta: "Prepaid meter", price: 2500 },
				{ name: "₦5,000 prepaid", meta: "Prepaid meter", price: 5000 },
				{ name: "₦10,000 prepaid", meta: "Prepaid meter", price: 10000 }
			]
		},
		{
			id: "ekedc",
			name: "Eko Electric",
			label: "Meter number",
			packages: [
				{ name: "₦2,500 prepaid", meta: "Prepaid meter", price: 2500 },
				{ name: "₦5,000 prepaid", meta: "Prepaid meter", price: 5000 },
				{ name: "₦10,000 prepaid", meta: "Prepaid meter", price: 10000 }
			]
		},
		{
			id: "water",
			name: "Lagos Water",
			label: "Account number",
			packages: [
				{ name: "₦2,000 water bill", meta: "1 month", price: 2000 },
				{ name: "₦5,000 water bill", meta: "1 month", price: 5000 }
			]
		}
	];

	var BOOKMAKERS = ["Bet9ja", "SportyBet", "1xBet", "BetKing"];

	var order = {
		service: "airtime",
		step: "details",
		network: "MTN",
		phone: "",
		amount: 0,
		fee: 0,
		plan: null,
		biller: BILLERS[0],
		packages: null,
		customer: "",
		bookmaker: BOOKMAKERS[0]
	};

	function qs(selector) {
		return document.querySelector(selector);
	}

	function qsa(selector) {
		return Array.prototype.slice.call(document.querySelectorAll(selector));
	}

	function setText(selector, value) {
		qsa(selector).forEach(function (node) {
			node.textContent = value;
		});
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

	function clearErrors() {
		["aphone", "aamount", "dphone", "damount", "bamount", "gcustomer", "gamount"].forEach(function (key) {
			setError(key, "");
		});
	}

	function digitsOnly(input, length) {
		if (!input) return "";
		return String(input.value || "").replace(/\D/g, "").slice(0, length);
	}

	function feeFor(service) {
		return service === "bill" ? 100 : 0;
	}

	/* --------------------------------------------------------------- chips */

	function paintNetworks() {
		qsa("[data-network-group]").forEach(function (group) {
			group.innerHTML = NETWORKS.map(function (network) {
				return (
					'<button class="choice' +
					(order.network === network ? " is-active" : "") +
					'" type="button" role="radio" aria-checked="' +
					(order.network === network ? "true" : "false") +
					'" data-network="' +
					network +
					'">' +
					network +
					"</button>"
				);
			}).join("");
		});
	}

	function paintDenominations() {
		var group = qs("[data-denoms]");
		if (!group) return;
		group.innerHTML = DENOMINATIONS.map(function (value) {
			return (
				'<button class="chip' +
				(order.amount === value ? " is-active" : "") +
				'" type="button" data-denom="' +
				value +
				'">' +
				Bee.money(value).replace(".00", "") +
				"</button>"
			);
		}).join("");
	}

	function paintPlans() {
		var list = qs("[data-plans]");
		if (!list) return;
		list.innerHTML = DATA_PLANS.map(function (plan, index) {
			var active = order.plan && order.plan.name === plan.name;
			return (
				'<button class="plan' +
				(active ? " is-active" : "") +
				'" type="button" role="radio" aria-checked="' +
				(active ? "true" : "false") +
				'" data-plan="' +
				index +
				'"><span><span class="plan-name">' +
				plan.name +
				'</span><span class="plan-meta">' +
				plan.meta +
				'</span></span><span class="plan-price">' +
				Bee.money(plan.price).replace(".00", "") +
				"</span></button>"
			);
		}).join("");
	}

	function paintBiller() {
		var select = qs("#b-biller");
		if (select) {
			select.innerHTML = BILLERS.map(function (biller) {
				return '<option value="' + biller.id + '">' + biller.name + "</option>";
			}).join("");
			select.value = order.biller.id;
		}

		var label = qs("[data-b-customer-label]");
		if (label) label.textContent = order.biller.label;

		order.packages = order.biller.packages[0];

		var list = qs("[data-packages]");
		if (list) {
			list.innerHTML = order.biller.packages
				.map(function (item, index) {
					var active = order.packages && order.packages.name === item.name;
					return (
						'<button class="plan' +
						(active ? " is-active" : "") +
						'" type="button" role="radio" aria-checked="' +
						(active ? "true" : "false") +
						'" data-package="' +
						index +
						'"><span><span class="plan-name">' +
						item.name +
						'</span><span class="plan-meta">' +
						item.meta +
						'</span></span><span class="plan-price">' +
						Bee.money(item.price).replace(".00", "") +
						"</span></button>"
					);
				})
				.join("");
		}
	}

	function paintBookmakers() {
		var select = qs("#g-provider");
		if (!select) return;
		select.innerHTML = BOOKMAKERS.map(function (name) {
			return '<option value="' + name + '">' + name + "</option>";
		}).join("");
		select.value = order.bookmaker;
	}

	/* ------------------------------------------------------------- summary */

	function currentAmount() {
		if (order.service === "airtime") {
			var custom = Bee.parseMoney((qs("#a-amount") || {}).value || 0);
			return custom || order.amount;
		}
		if (order.service === "data") return order.plan ? order.plan.price : 0;
		if (order.service === "bill") return order.packages ? order.packages.price : 0;
		return Bee.parseMoney((qs("#g-amount") || {}).value || 0);
	}

	function renderSummary() {
		var holder = qs("[data-summary]");
		if (!holder) return;

		var amount = currentAmount();
		var fee = feeFor(order.service);

		holder.innerHTML =
			'<p class="summary-title">Payment</p>' +
			'<p class="summary-wallet">' +
			window.Bee.ui.escape(order.service === "airtime" || order.service === "data" ? order.network : order.service === "bill" ? order.biller.name : order.bookmaker) +
			"</p>" +
			'<div class="summary-block">' +
			'<div class="qrow"><span>Available</span><b>' +
			Bee.money(Bee.wallet.available()) +
			"</b></div>" +
			'<div class="qrow"><span>Amount</span><b>' +
			Bee.money(amount) +
			"</b></div>" +
			'<div class="qrow"><span>Fee</span><b>' +
			(fee ? Bee.money(fee) : "Free") +
			"</b></div>" +
			'<div class="qrow is-total"><span>Total debit</span><b>' +
			Bee.money(amount + fee) +
			"</b></div></div>";
	}

	/* ---------------------------------------------------------------- flow */

	function showStep(step) {
		order.step = step;
		qsa("[data-step]").forEach(function (node) {
			node.hidden = node.getAttribute("data-step") !== step;
		});

		var aside = qs("[data-summary]");
		if (aside) aside.hidden = step === "receipt";

		var grid = qs(".money-grid");
		if (grid) grid.classList.toggle("is-single", step === "receipt");

		var index = step === "receipt" ? 2 : step === "review" ? 1 : 0;
		var holder = qs("[data-steps]");
		if (!holder) return;

		holder.innerHTML = ["Details", "Review", "Receipt"]
			.map(function (label, position) {
				var done = position < index;
				return (
					'<span class="step' +
					(done ? " is-done" : "") +
					(position === index ? " is-current" : "") +
					'"><span class="step-n">' +
					(done ? Bee.ui.icon("check") : String(position + 1)) +
					"</span><span>" +
					label +
					"</span></span>" +
					(position < 2 ? '<span class="step-sep"></span>' : "")
				);
			})
			.join("");

		Bee.ui.drawIcons();
	}

	function setService(service) {
		order.service = service;

		qsa("[data-service-panel]").forEach(function (panel) {
			panel.hidden = panel.getAttribute("data-service-panel") !== service;
		});

		qsa("[data-service]").forEach(function (button) {
			var active = button.getAttribute("data-service") === service;
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-selected", String(active));
		});

		setText("[data-service-title]", TITLES[service]);

		var url = new URL(window.location.href);
		url.searchParams.delete("service");
		if (service !== "airtime") url.searchParams.set("service", service);
		window.history.replaceState({}, "", url);

		clearErrors();
		renderSummary();
		showStep("details");
	}

	var TITLES = {
		airtime: "Buy airtime",
		data: "Buy data",
		bill: "Pay a bill",
		betting: "Fund a betting wallet"
	};

	/* -------------------------------------------------------------- review */

	function row(label, value, meta, total) {
		return (
			'<div class="review-row' +
			(total ? " review-total" : "") +
			'"><dt>' +
			label +
			"</dt><dd>" +
			value +
			(meta ? '<span class="sub">' + meta + "</span>" : "") +
			"</dd></div>"
		);
	}

	function describe() {
		var amount = currentAmount();

		if (order.service === "airtime") {
			return {
				title: order.network + " airtime",
				meta: order.phone,
				rows:
					row("Network", order.network) +
					row("Phone number", '<span class="num">' + order.phone + "</span>") +
					row("Amount", Bee.money(amount)),
				noun: "Airtime"
			};
		}

		if (order.service === "data") {
			return {
				title: order.network + " data " + order.plan.name,
				meta: order.phone,
				rows:
					row("Network", order.network) +
					row("Phone number", '<span class="num">' + order.phone + "</span>") +
					row("Plan", order.plan.name, order.plan.meta) +
					row("Amount", Bee.money(amount)),
				noun: "Data"
			};
		}

		if (order.service === "bill") {
			return {
				title: order.packages.name.replace(/^₦[\d,]+ /, ""),
				meta: order.customer + " · " + order.biller.name,
				rows:
					row("Biller", order.biller.name) +
					row(order.biller.label, '<span class="num">' + order.customer + "</span>") +
					row("Package", order.packages.name, order.packages.meta) +
					row("Amount", Bee.money(amount)),
				noun: "Bill"
			};
		}

		return {
			title: order.bookmaker + " wallet funding",
			meta: order.customer,
			rows:
				row("Provider", order.bookmaker) +
				row("Customer ID", '<span class="num">' + order.customer + "</span>") +
				row("Amount", Bee.money(amount)),
			noun: "Wallet"
		};
	}

	function validate() {
		clearErrors();
		var amount = currentAmount();
		var fee = feeFor(order.service);
		var valid = true;

		if (order.service === "airtime" || order.service === "data") {
			var phone = digitsOnly(qs("#" + (order.service === "airtime" ? "a" : "d") + "-phone"), 11);
			order.phone = phone;

			if (!/^0\d{10}$/.test(phone)) {
				setError(order.service === "airtime" ? "aphone" : "dphone", "Enter an 11-digit phone number.");
				valid = false;
			}
		}

		if (order.service === "airtime" && !amount) {
			setError("aamount", "Choose an amount or enter one.");
			valid = false;
		}

		if (order.service === "data" && !order.plan) {
			valid = false;
			Bee.ui.toast("Choose a data plan");
		}

		if (order.service === "bill") {
			order.customer = digitsOnly(qs("#b-customer"), 16);
			if (order.customer.length < 6) {
				setError("bamount", "Enter a valid " + order.biller.label.toLowerCase() + ".");
				valid = false;
			}
		}

		if (order.service === "betting") {
			order.customer = String((qs("#g-customer") || {}).value || "").trim();
			if (order.customer.length < 5) {
				setError("gcustomer", "Enter your customer ID at " + order.bookmaker + ".");
				valid = false;
			}
		}

		if (amount <= 0) {
			valid = false;
			if (order.service === "airtime") setError("aamount", "Choose an amount or enter one.");
		} else if (amount + fee > Bee.wallet.available()) {
			valid = false;
			setError(
				order.service === "airtime" ? "aamount" : order.service === "data" ? "damount" : order.service === "bill" ? "bamount" : "gamount",
				"This is more than your available balance."
			);
		}

		return valid;
	}

	function goReview() {
		if (!validate()) return;

		var info = describe();
		var amount = currentAmount();
		var fee = feeFor(order.service);

		qs("[data-review-rows]").innerHTML =
			info.rows + row("Fee", fee ? Bee.money(fee) : "Free") + row("Total debit", Bee.money(amount + fee), null, true);

		setText("[data-review-title]", "Review " + info.noun.toLowerCase() + " payment");
		showStep("review");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function confirm() {
		var amount = currentAmount();
		var fee = feeFor(order.service);
		var info = describe();

		var transaction = Bee.wallet.record({
			kind: order.service,
			title: info.title,
			meta: info.meta,
			amount: -amount,
			fee: fee,
			status: "successful"
		});

		var mark = qs("[data-receipt-mark]");
		if (mark) {
			mark.className = "receipt-mark";
			mark.innerHTML = Bee.ui.icon("check");
		}

		setText("[data-receipt-title]", info.noun + " payment successful");
		setText(
			"[data-receipt-sub]",
			order.service === "betting"
				? "Funded at " + order.bookmaker + "."
				: order.service === "bill"
				? "Sent to " + order.biller.name + "."
				: "Sent to " + order.phone + "."
		);

		var amountNode = qs("[data-receipt-amount]");
		if (amountNode) amountNode.textContent = Bee.plain(amount);

		qs("[data-receipt-rows]").innerHTML =
			row("Reference", '<span class="num">' + window.Bee.ui.escape(transaction.ref) + "</span>") +
			info.rows +
			row("Fee", fee ? Bee.money(fee) : "Free") +
			row("Total debit", Bee.money(amount + fee), null, true) +
			row("Date", Bee.date.stamp(transaction.createdAt)) +
			'<div class="review-row"><dt>Status</dt><dd><span class="status is-ok">' +
			Bee.ui.icon("check") +
			"Successful</span></dd></div>";

		showStep("receipt");
		Bee.ui.drawIcons();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	/* ----------------------------------------------------------------- init */

	function init() {
		paintNetworks();
		paintDenominations();
		paintPlans();
		paintBiller();
		paintBookmakers();

		var amountInput = qs("#a-amount");
		if (amountInput) Bee.ui.moneyInput(amountInput);
		var betAmount = qs("#g-amount");
		if (betAmount) Bee.ui.moneyInput(betAmount);

		document.addEventListener("click", function (event) {
			var service = event.target.closest("[data-service]");
			if (service) {
				setService(service.getAttribute("data-service"));
				return;
			}

			var network = event.target.closest("[data-network]");
			if (network) {
				order.network = network.getAttribute("data-network");
				paintNetworks();
				renderSummary();
				return;
			}

			var denom = event.target.closest("[data-denom]");
			if (denom) {
				order.amount = Number(denom.getAttribute("data-denom"));
				if (amountInput) amountInput.value = "";
				paintDenominations();
				renderSummary();
				return;
			}

			var plan = event.target.closest("[data-plan]");
			if (plan) {
				order.plan = DATA_PLANS[Number(plan.getAttribute("data-plan"))];
				paintPlans();
				renderSummary();
				return;
			}

			var pack = event.target.closest("[data-package]");
			if (pack) {
				order.packages = order.biller.packages[Number(pack.getAttribute("data-package"))];
				paintBiller();
				renderSummary();
				return;
			}

			if (event.target.closest("[data-review]")) {
				goReview();
				return;
			}

			if (event.target.closest("[data-edit]")) {
				showStep("details");
				return;
			}

			if (event.target.closest("[data-confirm]")) {
				confirm();
				return;
			}

			if (event.target.closest("[data-new]")) {
				reset();
				return;
			}

			if (event.target.closest("[data-print]")) {
				window.print();
			}
		});

		["#a-phone", "#d-phone", "#b-customer", "#g-customer", "#a-amount", "#g-amount"].forEach(function (selector) {
			var field = qs(selector);
			if (!field) return;
			field.addEventListener("input", function () {
				if (field.id === "a-amount") order.amount = 0;
				paintDenominations();
				renderSummary();
			});
		});

		var billerSelect = qs("#b-biller");
		if (billerSelect) {
			billerSelect.addEventListener("change", function () {
				order.biller = BILLERS.find(function (item) {
					return item.id === billerSelect.value;
				}) || BILLERS[0];
				order.customer = "";
				var customer = qs("#b-customer");
				if (customer) customer.value = "";
				paintBiller();
				renderSummary();
			});
		}

		var providerSelect = qs("#g-provider");
		if (providerSelect) {
			providerSelect.addEventListener("change", function () {
				order.bookmaker = providerSelect.value;
				renderSummary();
			});
		}

		var requested = new URLSearchParams(window.location.search).get("service");
		if (requested && TITLES[requested]) order.service = requested;

		order.plan = DATA_PLANS[1];
		order.amount = 1000;

		setService(order.service);
		paintDenominations();
		Bee.wallet.onChange(renderSummary);
		Bee.ui.drawIcons();
	}

	function reset() {
		order.amount = 1000;
		order.plan = DATA_PLANS[1];
		order.customer = "";
		order.phone = "";

		["#a-phone", "#d-phone", "#a-amount", "#g-amount", "#b-customer", "#g-customer"].forEach(function (selector) {
			var field = qs(selector);
			if (field) field.value = "";
		});

		clearErrors();
		paintDenominations();
		renderSummary();
		showStep("details");
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window);
