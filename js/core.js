/* ==========================================================================
   beeapp — core
   Wallet state, money and date formatting, seeded records, small UI helpers.
   Loaded on every page before any screen script.
   ========================================================================== */

(function (window) {
	"use strict";

	var STATE_KEY = "beeapp.wallet.v1";
	var SESSION_KEY = "beeapp.session.v1";
	var DAILY_LIMIT = 500000;

	var NGN = new Intl.NumberFormat("en-NG", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	/* ---------------------------------------------------------------- money */

	function money(value, options) {
		var settings = options || {};
		var digits = value < 0 ? "−" : settings.sign ? "+" : "";
		var body = NGN.format(Math.abs(Number(value) || 0));
		return digits + (settings.bare ? "" : "₦") + body;
	}

	function signedMoney(value) {
		return money(value, { sign: true });
	}

	function plain(value) {
		return NGN.format(Math.abs(Number(value) || 0));
	}

	function parseMoney(text) {
		var cleaned = String(text).replace(/[^0-9.]/g, "");
		var parts = cleaned.split(".");
		if (parts.length > 2) cleaned = parts.shift() + "." + parts.join("");
		var number = Number(cleaned);
		return Number.isFinite(number) ? number : 0;
	}

	function groupDigits(text) {
		var raw = String(text).replace(/[^0-9.]/g, "");
		if (!raw) return "";
		var pieces = raw.split(".");
		var whole = pieces[0].replace(/^0+(?=\d)/, "");
		var grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		if (pieces.length > 1) {
			return grouped + "." + pieces.slice(1).join("").slice(0, 2);
		}
		return grouped;
	}

	/* ---------------------------------------------------------------- dates */

	function shortDate(iso) {
		var date = new Date(iso);
		return date.getDate() + " " + MONTHS[date.getMonth()] + " " + date.getFullYear();
	}

	function clockTime(iso) {
		var date = new Date(iso);
		var hours = String(date.getHours()).padStart(2, "0");
		var minutes = String(date.getMinutes()).padStart(2, "0");
		return hours + ":" + minutes;
	}

	function dayLabel(iso) {
		var date = new Date(iso);
		var today = new Date();
		var startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
		var startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
		var diff = Math.round((startOfToday - startOfDate) / 86400000);
		if (diff === 0) return "Today";
		if (diff === 1) return "Yesterday";
		return shortDate(iso);
	}

	function fullStamp(iso) {
		return shortDate(iso) + " at " + clockTime(iso);
	}

	/* ----------------------------------------------------------------- fees */

	// NIP transfer fee tiers used by Nigerian banks.
	function withdrawalFee(amount) {
		if (amount <= 5000) return 10;
		if (amount <= 50000) return 25;
		return 50;
	}

	/* ----------------------------------------------------------------- seed */

	function hoursAgo(hours) {
		return new Date(Date.now() - hours * 3600 * 1000).toISOString();
	}

	function seedReference(seed) {
		var tail = String(Math.abs(seed) % 100000000000);
		while (tail.length < 12) tail = "8" + tail;
		return "BP" + tail;
	}

	function seedState() {
		var records = [
			{
				kind: "withdrawal",
				title: "Withdrawal to Access Bank",
				meta: "Access Bank · 0134567890",
				amount: -45000,
				fee: 25,
				status: "successful",
				hours: 4,
				details: { bankName: "Access Bank", bankCode: "044", accountNumber: "0134567890", accountName: "AMAKA J. OBI" }
			},
			{
				kind: "deposit",
				title: "Deposit from Providus Bank",
				meta: "Bank transfer",
				amount: 100000,
				fee: 0,
				status: "successful",
				hours: 9
			},
			{
				kind: "transfer",
				title: "Transfer to Amaka J. Obi",
				meta: "Guaranty Trust Bank · 0123456789",
				amount: -15000,
				fee: 0,
				status: "processing",
				hours: 27,
				details: { bankName: "Guaranty Trust Bank", bankCode: "058", accountNumber: "0123456789", accountName: "AMAKA J. OBI" }
			},
			{
				kind: "airtime",
				title: "MTN airtime",
				meta: "08024156932",
				amount: -2000,
				fee: 0,
				status: "successful",
				hours: 33
			},
			{
				kind: "betting",
				title: "Bet9ja wallet funding",
				meta: "Bet9ja · 8841029",
				amount: -5000,
				fee: 0,
				status: "successful",
				hours: 52
			},
			{
				kind: "bill",
				title: "DStv Compact",
				meta: "7034512890",
				amount: -19000,
				fee: 100,
				status: "failed",
				hours: 74
			},
			{
				kind: "data",
				title: "MTN data 10GB",
				meta: "08024156932",
				amount: -4500,
				fee: 0,
				status: "successful",
				hours: 96
			},
			{
				kind: "withdrawal",
				title: "Withdrawal to Kuda Bank",
				meta: "Kuda Bank · 2087431905",
				amount: -12000,
				fee: 25,
				status: "successful",
				hours: 120,
				details: { bankName: "Kuda Bank", bankCode: "50211", accountNumber: "2087431905", accountName: "CHUKWUMA EZE" }
			}
		];

		var transactions = records.map(function (record, index) {
			var createdAt = hoursAgo(record.hours);
			return {
				id: "seed_" + index,
				ref: seedReference(createdAt.replace(/\D/g, "").slice(0, 12)),
				kind: record.kind,
				title: record.title,
				meta: record.meta,
				amount: record.amount,
				fee: record.fee,
				status: record.status,
				createdAt: createdAt,
				details: record.details || null
			};
		});

		return {
			version: 1,
			profile: {
				firstName: "Chinedu",
				lastName: "Eze",
				handle: "chinedue",
				phone: "08024156932",
				email: "chinedu.eze@example.com"
			},
			wallet: {
				number: "8024156932",
				bankName: "Providus Bank",
				bankCode: "101"
			},
			balance: 184920.75,
			limitDaily: DAILY_LIMIT,
			savedAccounts: [
				{ id: "sa_1", name: "AMAKA J. OBI", bankName: "Guaranty Trust Bank", bankCode: "058", accountNumber: "0123456789" },
				{ id: "sa_2", name: "ODINAKA NWOSU", bankName: "Access Bank", bankCode: "044", accountNumber: "0134567890" },
				{ id: "sa_3", name: "CHUKWUMA EZE", bankName: "Kuda Bank", bankCode: "50211", accountNumber: "2087431905" }
			],
			transactions: transactions
		};
	}

	/* ---------------------------------------------------------------- store */

	var state = null;
	var listeners = [];

	function readState() {
		if (state) return state;
		try {
			var stored = JSON.parse(window.localStorage.getItem(STATE_KEY) || "null");
			if (stored && stored.version === 1 && Array.isArray(stored.transactions)) {
				state = stored;
				return state;
			}
		} catch (error) {
			/* corrupted or unavailable storage falls through to a fresh seed */
		}
		state = seedState();
		writeState();
		return state;
	}

	function writeState() {
		try {
			window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
		} catch (error) {
			/* storage may be blocked; the session still works in memory */
		}
	}

	function emit() {
		listeners.forEach(function (listener) {
			try {
				listener(readState());
			} catch (error) {
				/* a broken listener must not stop the others */
			}
		});
		window.dispatchEvent(new CustomEvent("bee:walletchange"));
	}

	/* --------------------------------------------------------------- wallet */

	var wallet = {
		get: readState,

		onChange: function (listener) {
			listeners.push(listener);
			return function () {
				listeners = listeners.filter(function (item) {
					return item !== listener;
				});
			};
		},

		available: function () {
			return readState().balance;
		},

		pending: function () {
			return readState().transactions.reduce(function (total, tx) {
				return tx.status === "processing" && tx.amount < 0 ? total + Math.abs(tx.amount) : total;
			}, 0);
		},

		usedToday: function () {
			var today = new Date().toDateString();
			return readState().transactions.reduce(function (total, tx) {
				var outbound = tx.amount < 0 && (tx.kind === "withdrawal" || tx.kind === "transfer");
				var settled = tx.status === "successful" || tx.status === "processing";
				if (!outbound || !settled) return total;
				return new Date(tx.createdAt).toDateString() === today ? total + Math.abs(tx.amount) : total;
			}, 0);
		},

		limit: function () {
			return readState().limitDaily;
		},

		makeReference: function () {
			var stamp = String(Date.now()).slice(-9);
			var random = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
			return "BP" + stamp + random;
		},

		record: function (entry) {
			var current = readState();
			var transaction = {
				id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
				ref: entry.ref || wallet.makeReference(),
				kind: entry.kind,
				title: entry.title,
				meta: entry.meta || "",
				amount: entry.amount,
				fee: entry.fee || 0,
				status: entry.status || "successful",
				createdAt: entry.createdAt || new Date().toISOString(),
				details: entry.details || null
			};

			current.transactions.unshift(transaction);
			current.transactions = current.transactions.slice(0, 120);
			// the fee is charged on top of the amount that reaches the recipient
			current.balance = Math.round((current.balance + transaction.amount - transaction.fee) * 100) / 100;
			writeState();
			emit();
			return transaction;
		},

		find: function (id) {
			return readState().transactions.find(function (tx) {
				return tx.id === id;
			});
		},

		addSavedAccount: function (account) {
			var current = readState();
			var exists = current.savedAccounts.some(function (saved) {
				return saved.accountNumber === account.accountNumber && saved.bankCode === account.bankCode;
			});
			if (exists) return;
			current.savedAccounts.unshift({
				id: "sa_" + Date.now(),
				name: account.name,
				bankName: account.bankName,
				bankCode: account.bankCode,
				accountNumber: account.accountNumber
			});
			writeState();
			emit();
		},

		reset: function () {
			state = seedState();
			writeState();
			emit();
		}
	};

	/* -------------------------------------------------------------- session */

	var session = {
		get: function () {
			try {
				return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null");
			} catch (error) {
				return null;
			}
		},

		start: function (profile) {
			var current = readState();
			if (profile) current.profile = Object.assign({}, current.profile, profile);
			writeState();
			try {
				window.localStorage.setItem(SESSION_KEY, JSON.stringify({ signedInAt: new Date().toISOString() }));
			} catch (error) {
				/* ignore */
			}
		},

		end: function () {
			try {
				window.localStorage.removeItem(SESSION_KEY);
			} catch (error) {
				/* ignore */
			}
		}
	};

	/* ------------------------------------------------------------ status map */

	var STATUS = {
		successful: { label: "Successful", icon: "check", className: "is-ok" },
		processing: { label: "Processing", icon: "clock-3", className: "is-warn" },
		failed: { label: "Failed", icon: "x", className: "is-fail" }
	};

	var KIND_ICON = {
		withdrawal: "banknote",
		deposit: "arrow-down-to-line",
		transfer: "arrow-left-right",
		airtime: "smartphone",
		data: "wifi",
		bill: "zap",
		betting: "dice-5"
	};

	/* ------------------------------------------------------------------- ui */

	function icon(name) {
		return '<i data-lucide="' + name + '" aria-hidden="true"></i>';
	}

	function drawIcons() {
		if (window.lucide && typeof window.lucide.createIcons === "function") {
			window.lucide.createIcons();
		}
	}

	var toastTimer = null;

	function toast(message) {
		var node = document.querySelector(".toast");
		if (!node) {
			node = document.createElement("div");
			node.className = "toast";
			node.setAttribute("role", "status");
			node.setAttribute("aria-live", "polite");
			document.body.appendChild(node);
		}
		node.textContent = message;
		window.requestAnimationFrame(function () {
			node.classList.add("is-visible");
		});
		window.clearTimeout(toastTimer);
		toastTimer = window.setTimeout(function () {
			node.classList.remove("is-visible");
		}, 2600);
	}

	function copy(text, message) {
		var value = String(text);

		function done() {
			toast(message || "Copied");
		}

		if (window.navigator.clipboard && window.isSecureContext) {
			window.navigator.clipboard.writeText(value).then(done, function () {
				legacyCopy(value);
				done();
			});
			return;
		}
		legacyCopy(value);
		done();
	}

	function legacyCopy(value) {
		var field = document.createElement("textarea");
		field.value = value;
		field.setAttribute("readonly", "");
		field.style.position = "fixed";
		field.style.opacity = "0";
		document.body.appendChild(field);
		field.select();
		try {
			document.execCommand("copy");
		} catch (error) {
			/* ignore */
		}
		document.body.removeChild(field);
	}

	function moneyInput(input) {
		if (!input) return;
		input.addEventListener("input", function () {
			var caretEnd = input.selectionStart === input.value.length;
			input.value = groupDigits(input.value);
			if (caretEnd) input.setSelectionRange(input.value.length, input.value.length);
		});
	}

	function escapeHtml(value) {
		return String(value === undefined || value === null ? "" : value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	/* ---------------------------------------------------------------- export */

	window.Bee = {
		money: money,
		signed: signedMoney,
		plain: plain,
		parseMoney: parseMoney,
		groupDigits: groupDigits,
		date: {
			short: shortDate,
			time: clockTime,
			day: dayLabel,
			stamp: fullStamp
		},
		fee: {
			withdrawal: withdrawalFee
		},
		wallet: wallet,
		session: session,
		status: STATUS,
		kindIcon: KIND_ICON,
		ui: {
			icon: icon,
			drawIcons: drawIcons,
			toast: toast,
			copy: copy,
			moneyInput: moneyInput,
			escape: escapeHtml
		}
	};
})(window);
