/* ==========================================================================
   beeapp — statement
   Search, filter, inspect a receipt, or export the filtered rows as CSV.
   ========================================================================== */

(function (window) {
	"use strict";

	var Bee = window.Bee;
	var filters = { query: "", type: "all", status: "all", range: "all" };

	var RANGE_DAYS = { all: 0, "7": 7, "30": 30, "90": 90 };

	function matchesType(transaction, type) {
		if (type === "all") return true;
		if (type === "purchase") {
			return ["airtime", "data", "bill", "betting"].indexOf(transaction.kind) > -1;
		}
		return transaction.kind === type;
	}

	function matchesQuery(transaction, query) {
		if (!query) return true;
		var term = query.toLowerCase();
		return [transaction.title, transaction.meta, transaction.ref, transaction.details && transaction.details.accountName]
			.filter(Boolean)
			.some(function (field) {
				return String(field).toLowerCase().indexOf(term) > -1;
			});
	}

	function matchesRange(transaction) {
		var days = RANGE_DAYS[filters.range] || 0;
		if (!days) return true;
		var cutoff = Date.now() - days * 86400000;
		return new Date(transaction.createdAt).getTime() >= cutoff;
	}

	function filtered() {
		return Bee.wallet.get().transactions.filter(function (transaction) {
			return (
				matchesType(transaction, filters.type) &&
				matchesQuery(transaction, filters.query) &&
				(filters.status === "all" || transaction.status === filters.status) &&
				matchesRange(transaction)
			);
		});
	}

	function render() {
		var rows = document.querySelector("[data-statement-rows]");
		if (!rows) return;

		var list = filtered();
		var empty = document.querySelector("[data-statement-empty]");
		var table = document.querySelector("[data-statement-table]");

		if (!list.length) {
			rows.innerHTML = "";
			if (table) table.hidden = true;
			if (empty) empty.hidden = false;
		} else {
			if (table) table.hidden = false;
			if (empty) empty.hidden = true;
			Bee.ledger.mount(rows, list);
		}

		var count = document.querySelector("[data-statement-count]");
		if (count) {
			count.textContent = list.length + (list.length === 1 ? " transaction" : " transactions");
		}
	}

	function csvCell(value) {
		var text = String(value === undefined || value === null ? "" : value);
		return '"' + text.replace(/"/g, '""') + '"';
	}

	function download() {
		var list = filtered();
		var header = ["Reference", "Type", "Description", "Destination", "Date", "Status", "Amount", "Fee"];
		var lines = [header.map(csvCell).join(",")];

		list.forEach(function (transaction) {
			lines.push(
				[
					transaction.ref,
					transaction.kind,
					transaction.title,
					transaction.meta,
					Bee.date.stamp(transaction.createdAt),
					transaction.status,
					Math.abs(transaction.amount).toFixed(2),
					transaction.fee.toFixed(2)
				]
					.map(csvCell)
					.join(",")
			);
		});

		var blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
		var link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "beeapp-statement-" + new Date().toISOString().slice(0, 10) + ".csv";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(link.href);
		Bee.ui.toast(list.length + " transactions exported");
	}

	function wire() {
		var search = document.querySelector("[data-filter-search]");
		var type = document.querySelector("[data-filter-type]");
		var status = document.querySelector("[data-filter-status]");
		var range = document.querySelector("[data-filter-range]");
		var exportButton = document.querySelector("[data-export]");
		var clear = document.querySelector("[data-clear-filters]");

		if (search) {
			search.addEventListener("input", function () {
				filters.query = search.value.trim();
				render();
			});
		}

		if (type) {
			type.addEventListener("change", function () {
				filters.type = type.value;
				render();
			});
		}

		if (status) {
			status.addEventListener("change", function () {
				filters.status = status.value;
				render();
			});
		}

		if (range) {
			range.addEventListener("change", function () {
				filters.range = range.value;
				render();
			});
		}

		if (exportButton) exportButton.addEventListener("click", download);

		if (clear) {
			clear.addEventListener("click", function () {
				filters = { query: "", type: "all", status: "all", range: "all" };
				if (search) search.value = "";
				if (type) type.value = "all";
				if (status) status.value = "all";
				if (range) range.value = "all";
				render();
			});
		}
	}

	function init() {
		wire();
		render();
		Bee.wallet.onChange(render);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window);
