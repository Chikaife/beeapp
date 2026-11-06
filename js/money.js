/* ==========================================================================
   beeapp — money movement
   Withdrawal to a bank account, transfer to a beetag, and wallet funding.
   Details → Review → Receipt, with account-name resolution before review.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;

	var MODES = {
		withdraw: {
			title: "Withdraw",
			sub: "Send money from your beeapp wallet to a Nigerian bank account.",
			steps: ["Details", "Review", "Receipt"]
		},
		transfer: {
			title: "Transfer",
			sub: "Send money to another beeapp account at no cost.",
			steps: ["Details", "Review", "Receipt"]
		},
		deposit: {
			title: "Deposit",
			sub: "Fund your wallet by transfer to your dedicated account.",
			steps: null
		}
	};

	var draft = {
		mode: "withdraw",
		step: "details",
		amount: 0,
		bank: null,
		accountNumber: "",
		accountName: "",
		recipientName: "",
		recipientHandle: "",
		narration: "",
		senderBank: null
	};

	var pickers = {};
	var resolveTimer = null;
	var lookupTimer = null;

	/* ---------------------------------------------------------------- dom */

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

			if (input.parentNode && input.parentNode.classList.contains("input-prefix")) {
				input.parentNode.setAttribute("data-invalid", message ? "true" : "false");
			}
		}
	}

	function clearErrors() {
		["wamount", "wbank", "waccount", "tamount", "trecipient", "damount"].forEach(function (key) {
			setError(key, "");
		});
	}

	function amountIn(selector) {
		return Bee.parseMoney((qs(selector) || {}).value || 0);
	}

	function currentMode() {
		return MODES[draft.mode];
	}

	function feeAmount() {
		if (draft.mode !== "withdraw" || draft.amount <= 0) return 0;
		return Bee.fee.withdrawal(draft.amount);
	}

	/* -------------------------------------------------------- bank picker */

	function createBankPicker(root, onSelect) {
		if (!root) return null;

		var input = root.querySelector("input");
		var list = root.querySelector(".combo-list");
		var codeEl = root.querySelector(".combo-code");
		var current = null;
		var results = [];
		var active = -1;

		function paint(term) {
			results = Bee.banks.search(term || "", 80);

			if (!results.length) {
				list.innerHTML = '<div class="combo-empty">No bank matches that name.</div>';
			} else {
				list.innerHTML =
					'<div class="combo-count">' +
					results.length +
					" banks</div>" +
					results
						.map(function (bank, index) {
							return (
								'<div class="combo-option" role="option" id="' +
								root.id +
								"-opt-" +
								index +
								'" data-index="' +
								index +
								'" aria-selected="' +
								(current && current.code === bank.code ? "true" : "false") +
								'"><span>' +
								window.Bee.ui.escape(bank.name) +
								'</span><span class="combo-option-code">' +
								bank.code +
								"</span></div>"
							);
						})
						.join("");
			}

			active = -1;
			input.removeAttribute("aria-activedescendant");
		}

		function open(term) {
			paint(term);
			list.hidden = false;
			input.setAttribute("aria-expanded", "true");
		}

		function close() {
			list.hidden = true;
			input.setAttribute("aria-expanded", "false");
			input.removeAttribute("aria-activedescendant");
			active = -1;
		}

		function choose(bank) {
			current = bank;
			input.value = bank ? bank.name : "";
			codeEl.textContent = bank ? bank.code : "";
			close();
			if (onSelect) onSelect(bank);
		}

		function highlight(direction) {
			var items = list.querySelectorAll(".combo-option");
			if (!items.length) return;
			if (active > -1 && items[active]) items[active].classList.remove("is-active");
			active = (active + direction + items.length) % items.length;
			items[active].classList.add("is-active");
			items[active].scrollIntoView({ block: "nearest" });
			input.setAttribute("aria-activedescendant", items[active].id);
		}

		input.addEventListener("focus", function () {
			var unchanged = current && input.value === current.name;
			open(unchanged ? "" : input.value);
		});

		input.addEventListener("input", function () {
			if (current && input.value !== current.name) {
				current = null;
				codeEl.textContent = "";
				if (onSelect) onSelect(null);
			}
			open(input.value);
		});

		input.addEventListener("keydown", function (event) {
			var items = list.querySelectorAll(".combo-option");

			if (event.key === "ArrowDown") {
				event.preventDefault();
				if (list.hidden) open("");
				highlight(1);
			} else if (event.key === "ArrowUp") {
				event.preventDefault();
				if (list.hidden) open("");
				highlight(-1);
			} else if (event.key === "Enter") {
				if (!list.hidden && active > -1 && items[active]) {
					event.preventDefault();
					choose(results[Number(items[active].getAttribute("data-index"))]);
				}
			} else if (event.key === "Escape" || event.key === "Tab") {
				close();
			}
		});

		list.addEventListener("mousedown", function (event) {
			var option = event.target.closest(".combo-option");
			if (!option) return;
			event.preventDefault();
			choose(results[Number(option.getAttribute("data-index"))]);
		});

		input.addEventListener("blur", function () {
			window.setTimeout(function () {
				close();
				if (current && input.value.trim() !== current.name) choose(null);
				else if (!current && input.value.trim()) input.value = "";
			}, 120);
		});

		document.addEventListener("mousedown", function (event) {
			if (!root.contains(event.target)) close();
		});

		return {
			get: function () {
				return current;
			},
			set: function (bank) {
				choose(bank);
			},
			clear: function () {
				current = null;
				input.value = "";
				codeEl.textContent = "";
				close();
			},
			input: input
		};
	}

	/* ------------------------------------------------------------- summary */

	function renderSummary() {
		var holder = qs("[data-summary]");
		if (!holder) return;

		var state = Bee.wallet.get();

		if (draft.mode === "deposit") {
			holder.innerHTML =
				'<p class="summary-title">Receiving account</p>' +
				'<p class="summary-wallet">' +
				window.Bee.ui.escape(state.wallet.bankName) +
				"</p>" +
				'<div class="summary-block">' +
				'<div class="qrow"><span>Available</span><b>' +
				Bee.money(state.balance) +
				"</b></div>" +
				'<div class="qrow"><span>Pending</span><b>' +
				Bee.money(Bee.wallet.pending()) +
				"</b></div>" +
				'<div class="qrow"><span>Credited</span><b>Automatic</b></div>' +
				"</div>";
			return;
		}

		var fee = feeAmount();
		var total = draft.amount + fee;
		var used = Bee.wallet.usedToday();
		var limit = Bee.wallet.limit();
		var remaining = Math.max(0, limit - used);
		var share = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

		var quote =
			'<div class="summary-block">' +
			'<div class="qrow"><span>Available</span><b>' +
			Bee.money(state.balance) +
			"</b></div>" +
			'<div class="qrow"><span>' +
			(draft.mode === "withdraw" ? "Amount" : "Sending") +
			"</span><b>" +
			Bee.money(draft.amount) +
			"</b></div>" +
			'<div class="qrow"><span>' +
			(draft.mode === "withdraw" ? "Transfer fee" : "Fee") +
			"</span><b>" +
			(draft.mode === "withdraw" ? Bee.money(fee) : "Free") +
			"</b></div>" +
			'<div class="qrow is-total"><span>Total debit</span><b>' +
			Bee.money(total) +
			"</b></div></div>";

		var limitBlock =
			'<div class="summary-block">' +
			'<div class="qrow"><span>Daily withdrawal limit</span></div>' +
			'<p class="limit-figure">' +
			Bee.money(used) +
			" of " +
			Bee.money(limit) +
			"</p>" +
			'<div class="meter"><span style="width:' +
			Math.max(share, used > 0 ? 2 : 0) +
			'%"></span></div>' +
			'<p class="limit-note">' +
			Bee.money(remaining).replace("₦", "₦") +
			" left today</p>" +
			"</div>";

		holder.innerHTML =
			'<p class="summary-title">From wallet</p>' +
			'<p class="summary-wallet num">' +
			window.Bee.ui.escape(state.wallet.number) +
			"</p>" +
			quote +
			(draft.mode === "withdraw" ? limitBlock : "");
	}

	function renderSavedChips() {
		var holder = qs("[data-saved-chips]");
		if (!holder) return;

		var accounts = Bee.wallet.get().savedAccounts;
		if (!accounts.length) {
			holder.hidden = true;
			return;
		}

		holder.hidden = false;
		holder.innerHTML =
			'<span class="saved-picks-label">Saved</span>' +
			accounts
				.map(function (account, index) {
					return (
						'<button class="saved-pick" type="button" data-saved="' +
						index +
						'">' +
						window.Bee.ui.escape(titleCase(account.name)) +
						"</button>"
					);
				})
				.join("");
	}

	/* --------------------------------------------------------------- head */

	function renderSteps() {
		var holder = qs("[data-steps]");
		var config = currentMode();
		if (!holder) return;

		if (!config.steps) {
			holder.hidden = true;
			return;
		}

		holder.hidden = false;
		var labels = config.steps;
		var index = draft.step === "receipt" ? 2 : draft.step === "review" ? 1 : 0;

		holder.innerHTML = labels
			.map(function (label, position) {
				var done = position < index;
				var current = position === index;

				return (
					'<span class="step' +
					(done ? " is-done" : "") +
					(current ? " is-current" : "") +
					'"><span class="step-n">' +
					(done ? Bee.ui.icon("check") : String(position + 1)) +
					"</span><span>" +
					label +
					"</span></span>" +
					(position < labels.length - 1 ? '<span class="step-sep"></span>' : "")
				);
			})
			.join("");

		Bee.ui.drawIcons();
	}

	function showStep(step) {
		draft.step = step;
		qsa("[data-step]").forEach(function (node) {
			node.hidden = node.getAttribute("data-step") !== step;
		});

		var aside = qs("[data-summary]");
		if (aside) aside.hidden = step === "receipt";

		var grid = qs(".money-grid");
		if (grid) grid.classList.toggle("is-single", step === "receipt");

		renderSteps();
	}

	/* ------------------------------------------------------------ identity */

	function paintIdentity(selector, state, name, meta) {
		var node = qs(selector);
		if (!node) return;

		node.classList.remove("is-empty", "is-pending", "is-failed", "is-resolved");
		node.classList.add(
			state === "resolved" ? "is-resolved" : state === "pending" ? "is-pending" : state === "failed" ? "is-failed" : "is-empty"
		);

		var nameNode = node.querySelector(".identity-name");
		var metaNode = node.querySelector(".identity-meta");
		var mark = node.querySelector(".identity-mark");

		if (nameNode) nameNode.textContent = name || "";
		if (metaNode) metaNode.textContent = meta || "";

		if (mark) {
			mark.hidden = state !== "resolved" && state !== "failed";
			mark.classList.toggle("is-fail", state === "failed");
			mark.innerHTML = state === "failed" ? Bee.ui.icon("x") : Bee.ui.icon("check");
		}

		Bee.ui.drawIcons();
	}

	/* ---------------------------------------------------------- resolution */

	function resolveWithdrawAccount() {
		var input = qs("#w-account");
		var number = String((input && input.value) || "").replace(/\D/g, "").slice(0, 10);
		draft.accountNumber = number;
		draft.accountName = "";

		var bank = pickers.wbank ? pickers.wbank.get() : null;
		window.clearTimeout(resolveTimer);

		if (!bank || number.length !== 10) {
			paintIdentity(
				"[data-w-identity]",
				"empty",
				!bank ? "Select a bank first" : "Enter the 10-digit account number",
				!bank ? "The name on the account appears here." : ""
			);
			return;
		}

		paintIdentity("[data-w-identity]", "pending", "Resolving account name…", bank.name);

		resolveTimer = window.setTimeout(function () {
			var saved = Bee.wallet.get().savedAccounts.find(function (account) {
				return account.accountNumber === number && account.bankCode === bank.code;
			});
			var resolved = saved ? saved.name : Bee.banks.resolveAccount(number);

			if (!resolved || number.slice(-4) === "0000") {
				paintIdentity("[data-w-identity]", "failed", "Could not resolve this account", "Check the account number and try again.");
				window.Bee.ui.toast("Account name could not be resolved");
				return;
			}

			draft.accountName = resolved;
			paintIdentity("[data-w-identity]", "resolved", resolved, bank.name + " · " + number);
		}, 550);
	}

	function resolveRecipient() {
		var input = qs("#t-recipient");
		var value = String((input && input.value) || "").trim();
		draft.recipientHandle = value;
		draft.recipientName = "";
		window.clearTimeout(lookupTimer);

		if (!value) {
			paintIdentity("[data-t-identity]", "empty", "Enter a beetag or phone number", "Transfers to beeapp accounts are free.");
			return;
		}

		if (!Bee.banks.isHandle(value) && !/^0\d{10}$/.test(value)) {
			paintIdentity("[data-t-identity]", "empty", "Enter a valid beetag or 11-digit phone number", "");
			return;
		}

		paintIdentity("[data-t-identity]", "pending", "Looking up account…", value);

		lookupTimer = window.setTimeout(function () {
			var name = Bee.banks.resolveHandle(value);
			if (!name) {
				paintIdentity("[data-t-identity]", "failed", "No beeapp account found", "Check the beetag or phone number.");
				return;
			}
			draft.recipientName = name;
			paintIdentity("[data-t-identity]", "resolved", name, value + " · beeapp wallet");
		}, 500);
	}

	/* ------------------------------------------------------------- review */

	function reviewRow(label, value, meta, isTotal) {
		return (
			'<div class="review-row' +
			(isTotal ? " review-total" : "") +
			'"><dt>' +
			label +
			"</dt><dd>" +
			value +
			(meta ? '<span class="sub">' + meta + "</span>" : "") +
			"</dd></div>"
		);
	}

	function validateWithdraw() {
		clearErrors();
		var amount = amountIn("#w-amount");
		var fee = Bee.fee.withdrawal(amount);
		var available = Bee.wallet.available();
		var remaining = Math.max(0, Bee.wallet.limit() - Bee.wallet.usedToday());
		var valid = true;

		if (!amount) {
			setError("wamount", "Enter the amount you want to withdraw.");
			valid = false;
		} else if (amount < 100) {
			setError("wamount", "The minimum withdrawal is ₦100.");
			valid = false;
		} else if (amount + fee > available) {
			setError("wamount", "Amount plus the " + Bee.money(fee) + " fee is more than your available balance.");
			valid = false;
		} else if (amount > remaining) {
			setError("wamount", "This is above your remaining daily limit of " + Bee.money(remaining) + ".");
			valid = false;
		}

		if (!draft.bank) {
			setError("wbank", "Choose the bank account you are withdrawing to.");
			valid = false;
		}

		if (!draft.accountName) {
			setError("waccount", "Enter a valid 10-digit account number and wait for the name to resolve.");
			valid = false;
		}

		return valid ? { amount: amount, fee: fee } : null;
	}

	function buildWithdrawReview(quote) {
		qs("[data-review-rows]").innerHTML =
			reviewRow("Bank", window.Bee.ui.escape(draft.bank.name), "Bank code " + draft.bank.code) +
			reviewRow("Account number", '<span class="num">' + draft.accountNumber + "</span>") +
			reviewRow("Account name", window.Bee.ui.escape(draft.accountName)) +
			reviewRow("Amount", Bee.money(quote.amount)) +
			reviewRow("Transfer fee", Bee.money(quote.fee)) +
			reviewRow("Total debit", Bee.money(quote.amount + quote.fee), null, true);
	}

	function validateTransfer() {
		clearErrors();
		var amount = amountIn("#t-amount");
		var valid = true;

		if (!draft.recipientName) {
			setError("trecipient", "Enter a beetag or phone number that resolves to a beeapp account.");
			valid = false;
		}

		if (!amount) {
			setError("tamount", "Enter the amount you want to send.");
			valid = false;
		} else if (amount < 50) {
			setError("tamount", "The minimum transfer is ₦50.");
			valid = false;
		} else if (amount > Bee.wallet.available()) {
			setError("tamount", "This is more than your available balance.");
			valid = false;
		}

		return valid ? { amount: amount, fee: 0 } : null;
	}

	function buildTransferReview(quote) {
		qs("[data-review-rows]").innerHTML =
			reviewRow("Recipient", window.Bee.ui.escape(draft.recipientName), window.Bee.ui.escape(draft.recipientHandle)) +
			reviewRow("Amount", Bee.money(quote.amount)) +
			reviewRow("Fee", "Free") +
			reviewRow("Total debit", Bee.money(quote.amount), null, true) +
			(draft.narration ? reviewRow("Narration", window.Bee.ui.escape(draft.narration)) : "");
	}

	function goReview() {
		var quote = draft.mode === "transfer" ? validateTransfer() : validateWithdraw();
		if (!quote) return;

		draft.amount = quote.amount;

		if (draft.mode === "withdraw") buildWithdrawReview(quote);
		else buildTransferReview(quote);

		var title = qs("[data-review-title]");
		if (title) title.textContent = draft.mode === "withdraw" ? "Review withdrawal" : "Review transfer";

		var submit = qs("[data-confirm]");
		if (submit) submit.textContent = draft.mode === "withdraw" ? "Confirm withdrawal" : "Send money";

		showStep("review");
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	/* ------------------------------------------------------------ receipts */

	function openReceipt(transaction, copy) {
		var status = Bee.status[transaction.status] || Bee.status.successful;
		var mark = qs("[data-receipt-mark]");

		if (mark) {
			mark.className = "receipt-mark" + (transaction.status === "processing" ? " is-warn" : "");
			mark.innerHTML = Bee.ui.icon(transaction.status === "processing" ? "clock-3" : "check");
		}

		setText("[data-receipt-title]", copy.title);
		setText("[data-receipt-sub]", copy.sub);

		var amount = qs("[data-receipt-amount]");
		if (amount) amount.textContent = Bee.plain(Math.abs(transaction.amount));

		var rows = reviewRow("Reference", '<span class="num">' + window.Bee.ui.escape(transaction.ref) + "</span>");

		if (transaction.kind === "withdrawal") {
			rows +=
				reviewRow("Bank", window.Bee.ui.escape(transaction.details.bankName), "Bank code " + transaction.details.bankCode) +
				reviewRow("Account number", '<span class="num">' + transaction.details.accountNumber + "</span>") +
				reviewRow("Account name", window.Bee.ui.escape(transaction.details.accountName));
		} else if (transaction.kind === "transfer") {
			rows +=
				reviewRow("Recipient", window.Bee.ui.escape(transaction.details.accountName), window.Bee.ui.escape(transaction.details.accountNumber)) +
				(transaction.narration ? reviewRow("Narration", window.Bee.ui.escape(transaction.narration)) : "");
		} else if (transaction.kind === "deposit") {
			rows += reviewRow("Paid from", window.Bee.ui.escape(transaction.meta || "Bank transfer"));
		}

		rows +=
			reviewRow("Amount", Bee.money(Math.abs(transaction.amount))) +
			(transaction.fee ? reviewRow("Fee", Bee.money(transaction.fee)) : "") +
			(transaction.fee ? reviewRow("Total debit", Bee.money(Math.abs(transaction.amount) + transaction.fee), null, true) : "") +
			reviewRow("Date", Bee.date.stamp(transaction.createdAt)) +
			'<div class="review-row"><dt>Status</dt><dd><span class="status ' +
			status.className +
			'">' +
			Bee.ui.icon(status.icon) +
			status.label +
			"</span></dd></div>";

		qs("[data-receipt-rows]").innerHTML = rows;

		showStep("receipt");
		Bee.ui.drawIcons();
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function confirmWithdraw() {
		var fee = Bee.fee.withdrawal(draft.amount);
		var transaction = Bee.wallet.record({
			kind: "withdrawal",
			title: "Withdrawal to " + draft.bank.name,
			meta: draft.bank.name + " · " + draft.accountNumber,
			amount: -draft.amount,
			fee: fee,
			status: "processing",
			details: {
				bankName: draft.bank.name,
				bankCode: draft.bank.code,
				accountNumber: draft.accountNumber,
				accountName: draft.accountName
			}
		});

		openReceipt(transaction, {
			title: "Withdrawal is processing",
			sub: "Funds have left your wallet. The bank usually credits the account within 10 minutes."
		});
	}

	function confirmTransfer() {
		var transaction = Bee.wallet.record({
			kind: "transfer",
			title: "Transfer to " + titleCase(draft.recipientName),
			meta: draft.recipientHandle + " · beeapp",
			amount: -draft.amount,
			fee: 0,
			status: "processing",
			details: {
				accountName: draft.recipientName,
				accountNumber: draft.recipientHandle,
				bankName: "beeapp wallet"
			},
			narration: draft.narration
		});

		openReceipt(transaction, {
			title: "Transfer sent",
			sub: "The recipient sees the money as soon as beeapp confirms the transfer."
		});
	}

	function confirmDeposit() {
		clearErrors();
		var amount = amountIn("#d-amount");
		if (!amount || amount < 100) {
			setError("damount", "Enter the amount you transferred (minimum ₦100).");
			return;
		}

		var bank = draft.senderBank;
		var transaction = Bee.wallet.record({
			kind: "deposit",
			title: bank ? "Deposit from " + bank.name : "Deposit to wallet",
			meta: bank ? bank.name + " · " + (qs("#d-reference").value.trim() || "Bank transfer") : "Bank transfer",
			amount: amount,
			fee: 0,
			status: "successful"
		});

		openReceipt(transaction, {
			title: "Deposit added",
			sub: "The amount is now available in your beeapp wallet."
		});
	}

	function titleCase(value) {
		return String(value || "")
			.toLowerCase()
			.replace(/\b[a-z]/g, function (character) {
				return character.toUpperCase();
			});
	}

	/* --------------------------------------------------------------- reset */

	function resetDraft() {
		draft.amount = 0;
		draft.bank = null;
		draft.accountNumber = "";
		draft.accountName = "";
		draft.recipientName = "";
		draft.recipientHandle = "";
		draft.narration = "";

		["#w-amount", "#w-account", "#t-amount", "#t-recipient", "#t-narration", "#d-amount", "#d-reference"].forEach(function (selector) {
			var input = qs(selector);
			if (input) input.value = "";
		});

		if (pickers.wbank) pickers.wbank.clear();
		if (pickers.dbanks) pickers.dbanks.clear();

		clearErrors();
		paintIdentity("[data-w-identity]", "empty", "Enter bank and account number", "The name on the account appears here.");
		paintIdentity("[data-t-identity]", "empty", "Enter a beetag or phone number", "Transfers to beeapp accounts are free.");
		renderSummary();
	}

	/* ---------------------------------------------------------------- mode */

	function setMode(mode) {
		if (!MODES[mode]) mode = "withdraw";
		draft.mode = mode;

		qsa("[data-panel]").forEach(function (panel) {
			panel.hidden = panel.getAttribute("data-panel") !== mode;
		});

		qsa("[data-mode]").forEach(function (button) {
			var active = button.getAttribute("data-mode") === mode;
			button.classList.toggle("is-active", active);
			button.setAttribute("aria-selected", String(active));
		});

		qsa(".nav-item").forEach(function (link) {
			var href = link.getAttribute("href") || "";
			var current = mode === "deposit" ? false : href.indexOf("mode=" + mode) > -1;
			if (current) link.setAttribute("aria-current", "page");
			else link.removeAttribute("aria-current");
		});

		setText("[data-view-title]", MODES[mode].title);
		setText("[data-view-sub]", MODES[mode].sub);

		var url = new URL(window.location.href);
		url.searchParams.set("mode", mode);
		window.history.replaceState({}, "", url);

		clearErrors();
		renderSummary();
		showStep("details");
	}

	/* ------------------------------------------------------------------ wire */

	function init() {
		var params = new URLSearchParams(window.location.search);

		pickers.wbank = createBankPicker(qs("#w-bank"), function (bank) {
			draft.bank = bank;
			if (bank) setError("wbank", "");
			if (qs("#w-account") && qs("#w-account").value.length === 10) resolveWithdrawAccount();
			else paintIdentity("[data-w-identity]", "empty", bank ? "Enter the 10-digit account number" : "Select a bank first", bank ? "" : "The name on the account appears here.");
			renderSummary();
		});

		pickers.dbanks = createBankPicker(qs("#d-bank"), function (bank) {
			draft.senderBank = bank;
		});

		document.addEventListener("click", function (event) {
			var modeButton = event.target.closest("[data-mode]");
			if (modeButton) {
				setMode(modeButton.getAttribute("data-mode"));
				return;
			}

			var saved = event.target.closest("[data-saved]");
			if (saved) {
				var account = Bee.wallet.get().savedAccounts[Number(saved.getAttribute("data-saved"))];
				var savedBank = Bee.banks.byCode(account.bankCode) || Bee.banks.byName(account.bankName);
				if (savedBank && pickers.wbank) pickers.wbank.set(savedBank);
				var savedInput = qs("#w-account");
				if (savedInput) {
					savedInput.value = account.accountNumber;
					resolveWithdrawAccount();
				}
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
				if (draft.mode === "withdraw") confirmWithdraw();
				else confirmTransfer();
				return;
			}

			if (event.target.closest("[data-deposit-confirm]")) {
				confirmDeposit();
				return;
			}

			if (event.target.closest("[data-new]")) {
				resetDraft();
				showStep("details");
				return;
			}

			if (event.target.closest("[data-print]")) {
				window.print();
			}
		});

		var withdrawAmount = qs("#w-amount");
		if (withdrawAmount) {
			Bee.ui.moneyInput(withdrawAmount);
			withdrawAmount.addEventListener("input", function () {
				draft.amount = amountIn("#w-amount");
				renderSummary();
			});
		}

		var transferAmount = qs("#t-amount");
		if (transferAmount) {
			Bee.ui.moneyInput(transferAmount);
			transferAmount.addEventListener("input", function () {
				draft.amount = amountIn("#t-amount");
				renderSummary();
			});
		}

		var depositAmount = qs("#d-amount");
		if (depositAmount) Bee.ui.moneyInput(depositAmount);

		var withdrawAccount = qs("#w-account");
		if (withdrawAccount) {
			withdrawAccount.addEventListener("input", function () {
				withdrawAccount.value = withdrawAccount.value.replace(/\D/g, "").slice(0, 10);
				resolveWithdrawAccount();
			});
		}

		var recipient = qs("#t-recipient");
		if (recipient) recipient.addEventListener("input", resolveRecipient);

		var narration = qs("#t-narration");
		if (narration) {
			narration.addEventListener("input", function () {
				draft.narration = narration.value.trim();
			});
		}

		// receiving account details
		var state = Bee.wallet.get();
		setText(
			"[data-receive-name]",
			"BEEAPP/" + [state.profile.firstName, state.profile.lastName].filter(Boolean).join(" ").toUpperCase()
		);
		setText("[data-receive-bank]", state.wallet.bankName);

		setMode(params.get("mode") || "withdraw");
		renderSavedChips();
		resetDraft();

		// deep link from a saved account
		if (params.get("bank")) {
			var bank = Bee.banks.byCode(params.get("bank"));
			if (bank && pickers.wbank) pickers.wbank.set(bank);
		}

		if (params.get("account") && withdrawAccount) {
			withdrawAccount.value = String(params.get("account")).replace(/\D/g, "").slice(0, 10);
			resolveWithdrawAccount();
		}

		Bee.wallet.onChange(renderSummary);
		Bee.ui.drawIcons();
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window);
