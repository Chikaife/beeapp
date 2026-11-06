/* ==========================================================================
   beeapp — transaction receipt
   One dialog shared by the ledger, the statement and the payment screens.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;

	var NOUNS = {
		withdrawal: "Withdrawal",
		deposit: "Deposit",
		transfer: "Transfer",
		airtime: "Airtime purchase",
		data: "Data purchase",
		bill: "Bill payment",
		betting: "Wallet funding"
	};

	function heading(transaction) {
		var noun = NOUNS[transaction.kind] || "Transaction";
		return noun + " " + transaction.status;
	}

	function row(label, value, extra) {
		return (
			'<div class="review-row"><dt>' +
			label +
			"</dt><dd>" +
			value +
			(extra ? '<span class="sub">' + extra + "</span>" : "") +
			"</dd></div>"
		);
	}

	function build(transaction) {
		var status = Bee.status[transaction.status] || Bee.status.successful;
		var details = transaction.details || {};
		var outbound = transaction.amount < 0;
		var total = Math.abs(transaction.amount) + (transaction.fee || 0);

		var rows = row("Reference", '<span class="num">' + window.Bee.ui.escape(transaction.ref) + "</span>");
		rows +=
			'<div class="review-row"><dt>Status</dt><dd><span class="status ' +
			status.className +
			'">' +
			Bee.ui.icon(status.icon) +
			status.label +
			"</span></dd></div>";

		if (details.accountName) {
			rows += row(
				outbound ? "Sent to" : "Received from",
				window.Bee.ui.escape(details.accountName),
				window.Bee.ui.escape((details.bankName || "") + " · " + (details.accountNumber || ""))
			);
		} else if (transaction.meta) {
			rows += row(outbound ? "Sent to" : "Received from", window.Bee.ui.escape(transaction.meta));
		}

		rows += row("Amount", Bee.money(Math.abs(transaction.amount)));

		if (transaction.fee) {
			rows += row("Fee", Bee.money(transaction.fee));
			rows += row("Total " + (outbound ? "debit" : "credit"), Bee.money(total));
		}

		rows += row("Date", Bee.date.stamp(transaction.createdAt));

		return (
			'<div class="dialog-inner"><div class="dialog-head"><div><h2>' +
			window.Bee.ui.escape(heading(transaction)) +
			'</h2><p class="dialog-sub">' +
			Bee.date.stamp(transaction.createdAt) +
			'</p></div><button class="dialog-close" type="button" data-close aria-label="Close">' +
			Bee.ui.icon("x") +
			'</button></div><div class="receipt-details"><dl class="review">' +
			rows +
			'</dl></div><div class="dialog-actions"><button class="btn btn-outline" type="button" data-copy-ref="' +
			window.Bee.ui.escape(transaction.ref) +
			'">' +
			Bee.ui.icon("copy") +
			'Copy reference</button><button class="btn btn-primary" type="button" data-close>Close</button></div></div>'
		);
	}

	function open(transaction) {
		if (!transaction) return;
		var dialog = document.getElementById("receipt-dialog");

		if (!dialog) {
			dialog = document.createElement("dialog");
			dialog.id = "receipt-dialog";
			dialog.className = "dialog";
			document.body.appendChild(dialog);

			dialog.addEventListener("click", function (event) {
				if (event.target === dialog) dialog.close();
			});
		}

		dialog.innerHTML = build(transaction);
		dialog.showModal();
		Bee.ui.drawIcons();

		dialog.querySelectorAll("[data-close]").forEach(function (button) {
			button.addEventListener("click", function () {
				dialog.close();
			});
		});
	}

	document.addEventListener("click", function (event) {
		var trigger = event.target.closest("[data-copy-ref]");
		if (!trigger) return;
		Bee.ui.copy(trigger.getAttribute("data-copy-ref"), "Reference copied");
	});

	Bee.receipt = { open: open, build: build };
})(window);
