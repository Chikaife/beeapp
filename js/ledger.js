/* ==========================================================================
   beeapp — ledger row renderer
   Shared by the overview and the full statement so both read identically.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;

	function row(transaction) {
		var status = Bee.status[transaction.status] || Bee.status.successful;
		var iconName = Bee.kindIcon[transaction.kind] || "circle";
		var amountClass = transaction.amount > 0 ? "amount-in" : transaction.status === "failed" ? "amount-void" : "amount-out";

		return (
			'<button class="ledger-row is-clickable" type="button" data-tx="' +
			transaction.id +
			'">' +
			'<span class="cell-tx">' +
			'<span class="tx-icon">' +
			Bee.ui.icon(iconName) +
			"</span>" +
			'<span class="tx-text">' +
			'<span class="tx-title">' +
			window.Bee.ui.escape(transaction.title) +
			"</span>" +
			'<span class="tx-meta">' +
			Bee.ui.escape(transaction.meta) +
			"</span>" +
			"</span></span>" +
			'<span class="cell-date"><span class="num">' +
			Bee.date.short(transaction.createdAt) +
			'</span><span class="time">' +
			Bee.date.time(transaction.createdAt) +
			"</span></span>" +
			'<span class="cell-status"><span class="status ' +
			status.className +
			'">' +
			Bee.ui.icon(status.icon) +
			status.label +
			"</span></span>" +
			'<span class="cell-amount ' +
			amountClass +
			'">' +
			Bee.signed(transaction.amount) +
			"</span>" +
			"</button>"
		);
	}

	function mount(container, transactions) {
		if (!container) return;
		container.innerHTML = transactions.map(row).join("");
		Bee.ui.drawIcons();
	}

	document.addEventListener("click", function (event) {
		var trigger = event.target.closest("[data-tx]");
		if (!trigger) return;
		Bee.receipt.open(Bee.wallet.find(trigger.getAttribute("data-tx")));
	});

	Bee.ledger = { row: row, mount: mount };
})(window);
