/* ==========================================================================
   beeapp — overview screen
   Recent activity plus the saved-recipient shortcuts on the dashboard.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;
	var VISIBLE = 6;

	function render() {
		var rows = document.querySelector("[data-recent-rows]");
		if (!rows) return;

		var transactions = Bee.wallet.get().transactions;
		Bee.ledger.mount(rows, transactions.slice(0, VISIBLE));

		var count = document.querySelector("[data-recent-count]");
		if (count) {
			count.textContent =
				transactions.length > VISIBLE
					? "Showing " + VISIBLE + " of " + transactions.length
					: transactions.length + " transactions";
		}
	}

	function init() {
		render();
		Bee.wallet.onChange(render);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window);
