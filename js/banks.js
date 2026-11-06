/* ==========================================================================
   beeapp — Nigerian bank directory
   Names and CBN codes as supplied in gradarr_paystack_banks.csv (269 entries).
   Duplicate names are kept on purpose: the directory has real clashes that
   the code column disambiguates.
   ========================================================================== */

(function (window) {
	"use strict";

	var RAW = [
		"5TT MFB|51455",
		"78 Finance Company Ltd|40195",
		"9jaPay Microfinance Bank|090629",
		"9mobile 9Payment Service Bank|120001",
		"Abbey Mortgage Bank|404",
		"Above Only MFB|51204",
		"Abulesoro MFB|51312",
		"Access Bank|044",
		"Access Bank (Diamond)|063",
		"Accion Microfinance Bank|602",
		"Advancly MFB|090759",
		"Aella MFB|50315",
		"AG Mortgage Bank|90077",
		"Ahmadu Bello University Microfinance Bank|50036",
		"Airtel Smartcash PSB|120004",
		"AKU Microfinance Bank|51336",
		"Akuchukwu Microfinance Bank Limited|090561",
		"Al-Barakah Microfinance Bank|50055",
		"ALAT by WEMA|035A",
		"Alert MFB|51074",
		"ALLWORKERS MFB|50059",
		"Alpha Morgan Bank|108",
		"Alternative bank|000304",
		"Amaanah Non-Interest Finance Company|40207",
		"Amju Unique MFB|50926",
		"Aramoko MFB|50083",
		"ASO Savings and Loans|401",
		"Assets Microfinance Bank|50092",
		"Astrapolaris MFB LTD|MFB50094",
		"AVUENEGBE MICROFINANCE BANK|090478",
		"AWACASH MICROFINANCE BANK|51351",
		"AZTEC MICROFINANCE BANK LIMITED|51337",
		"Bainescredit MFB|51229",
		"Banc Corp Microfinance Bank|50117",
		"Bank78 Microfinance Bank|11072",
		"BANKIT MFB|50572",
		"BANKIT MICROFINANCE BANK LTD|50572",
		"BANKLY MFB|51341",
		"Baobab Microfinance Bank|MFB50992",
		"BC Kash Microfinance Bank|51212",
		"BellBank Microfinance Bank|51100",
		"Benysta Microfinance Bank Limited|51267",
		"Berachah Microfinance Bank Ltd.|50122",
		"Beststar Microfinance Bank|50123",
		"BLOC MFB|51411",
		"BOLD MFB|50725",
		"Boost Microfinance Bank|51449",
		"Bosak Microfinance Bank|650",
		"Bowen Microfinance Bank|50931",
		"Branch International Finance Company Limited|FC40163",
		"Brent Mortgage bank|90070",
		"BuyPower MFB|50645",
		"Carbon|565",
		"Cashbridge Microfinance Bank Limited|51353",
		"CASHCONNECT MFB|865",
		"Cedrus MFB|51437",
		"CEMCS Microfinance Bank|50823",
		"Centrum Finance|050032",
		"CHAMS MOBILE MFB|100036",
		"Chanelle Microfinance Bank Limited|50171",
		"Chikum Microfinance bank|312",
		"Citibank Nigeria|023",
		"CITYCODE MORTAGE BANK|070027",
		"Civic Microfinance Bank Limited|50186",
		"Consumer Microfinance Bank|50910",
		"Cool Microfinance Bank Limited|51458",
		"Corestep MFB|50204",
		"Coronation Merchant Bank|559",
		"County Finance Limited|FC40128",
		"Credit Direct Limited|40119",
		"Crescent MFB|51297",
		"Crust Microfinance Bank|090560",
		"CRUTECH MICROFINANCE BANK LTD|50216",
		"Dash Microfinance Bank|51368",
		"Davenport MICROFINANCE BANK|51334",
		"Dillon Microfinance Bank|51450",
		"Dot Microfinance Bank|50162",
		"EBSU Microfinance Bank|50922",
		"Ecobank Nigeria|050",
		"Ekimogun MFB|50263",
		"Ekondo Microfinance Bank|098",
		"ESO-E MICROFINANCE BANK LIMITED|50280",
		"Ethica MFB|51475",
		"EXCEL FINANCE BANK|090678",
		"Eyowo|50126",
		"Fairmoney Microfinance Bank|51318",
		"FCMB MFB|51241",
		"Fedeth MFB|50298",
		"Fewchore Finance Company Limited|050002",
		"FFS Microfinance Bank|51110",
		"Fidelity Bank|070",
		"Firmus MFB|51314",
		"First Bank of Nigeria|011",
		"First City Monument Bank|214",
		"FIRST ROYAL MICROFINANCE BANK|090164",
		"FIRSTMIDAS MFB|51333",
		"FirstTrust Mortgage Bank Nigeria|413",
		"Flutterwave MFB|090567",
		"Fortress MFB|D53",
		"FSDH Merchant Bank Limited|501",
		"FUTMINNA MICROFINANCE BANK|832",
		"Garun Mallam MFB|MFB51093",
		"Gateway Mortgage Bank LTD|812",
		"Globus Bank|00103",
		"Goldman MFB|090574",
		"GoMoney|100022",
		"GOOD SHEPHERD MICROFINANCE BANK|090664",
		"Goodnews Microfinance Bank|50739",
		"Greenwich Merchant Bank|562",
		"GROOMING MICROFINANCE BANK|51276",
		"GTI MFB|50368",
		"Guaranty Trust Bank|058",
		"Hackman Microfinance Bank|51251",
		"Haggai Mortgage Bank|90065",
		"Hasal Microfinance Bank|50383",
		"Hayat Trust MFB|51364",
		"HopePSB|120002",
		"IBANK Microfinance Bank|51211",
		"IBBU MFB|51279",
		"Ibile Microfinance Bank|51244",
		"Ibom Mortgage Bank|90012",
		"Ikoyi Osun MFB|50439",
		"Ilaro Poly Microfinance Bank|50442",
		"Imowo MFB|50453",
		"IMPERIAL HOMES MORTAGE BANK|415",
		"Infinity MFB|50457",
		"Infinity trust Mortgage Bank|070016",
		"ISUA MFB|090701",
		"Jaiz Bank|301",
		"Jigawa Savings and Loans Limited|070029",
		"Jubilee Life Mortgage Bank|402",
		"Kadpoly MFB|50502",
		"KANOPOLY MFB|51308",
		"Kayvee Microfinance Bank|5129",
		"Kegow (Chamsmobile)|00719",
		"Keystone Bank|082",
		"Kolomoni MFB|899",
		"Kolomoni Microfinance Bank|100025",
		"KONGAPAY (Kongapay Technologies Limited)(formerly Zinternet)|100025",
		"Kredi Money MFB LTD|50200",
		"Kuda Bank|50211",
		"Lagos Building Investment Company Plc.|90052",
		"Lemmy MFB|091003",
		"Letshego Microfinance Bank|090420",
		"Links MFB|50549",
		"Living Trust Mortgage Bank|031",
		"LOMA MFB|50491",
		"Lotus Bank|303",
		"Maal MFB|51444",
		"MAINSTREET MICROFINANCE BANK|090171",
		"Mayden Microfinance Bank|51474",
		"Mayfair MFB|50563",
		"Mega Microfinance Bank|50570",
		"Mint MFB|50304",
		"MINT-FINEX MFB|09",
		"Money Master PSB|946",
		"Moniepoint MFB|50515",
		"MTN Momo PSB|120003",
		"MUTUAL BENEFITS MICROFINANCE BANK|090190",
		"NDCC MICROFINANCE BANK|090679",
		"NET MICROFINANCE BANK|51361",
		"Nigerian Navy Microfinance Bank Limited|51142",
		"NIRSAL MICROFINANCE|51304",
		"Nombank MFB|50072",
		"NOVA BANK|561",
		"Novus MFB|51371",
		"NPF MICROFINANCE BANK|50629",
		"NSUK MICROFINANACE BANK|51261",
		"NUVION MFB|51392",
		"Olabisi Onabanjo University Microfinance Bank|50689",
		"OLUCHUKWU MICROFINANCE BANK LTD|50697",
		"OPay Digital Services Limited (OPay)|999992",
		"Optimus Bank Limited|107",
		"Pact Microfinance Bank|51477",
		"Paga|100002",
		"PalmPay|999991",
		"Parallex Bank|104",
		"Parkway - ReadyCash|311",
		"PATHFINDER MICROFINANCE BANK LIMITED|090680",
		"Paystack MFB|51457",
		"Paystack-Titan|100039",
		"Peace Microfinance Bank|50743",
		"PECANTRUST MICROFINANCE BANK LIMITED|51226",
		"Personal Trust MFB|51146",
		"Petra Mircofinance Bank Plc|50746",
		"Pettysave MFB|MFB51452",
		"PFI FINANCE COMPANY LIMITED|050021",
		"Platinum Mortgage Bank|268",
		"Pocket App|00716",
		"Polaris Bank|076",
		"Polyunwana MFB|50864",
		"PremiumTrust Bank|105",
		"Prospa Capital Microfinance Bank|50739",
		"PROSPERIS FINANCE LIMITED|050023",
		"Providus Bank|101",
		"QuickFund MFB|51293",
		"Rand Merchant Bank|502",
		"RANDALPHA MICROFINANCE BANK|090496",
		"Rank MFB|50130",
		"Refuge Mortgage Bank|90067",
		"REHOBOTH MICROFINANCE BANK|50761",
		"RenMoney Microfinance Bank|51049",
		"Rephidim Microfinance Bank|50994",
		"Retrust Mfb|51375",
		"Rex Microfinance Bank|51108",
		"Rigo Microfinance Bank Limited|51286",
		"ROCKSHIELD MICROFINANCE BANK|50767",
		"RSU MICROFINANCE BANK|50622",
		"Rubies MFB|125",
		"Safe Haven MFB|51113",
		"SAGE GREY FINANCE LIMITED|40165",
		"Shepherd Trust Microfinance Bank|50789",
		"Shield MFB|50582",
		"Signature Bank Ltd|106",
		"Solid Allianze MFB|51062",
		"Solid Rock MFB|50800",
		"Sparkle Microfinance Bank|51310",
		"SPECTRUM MFB LTD|50756",
		"Springfield Microfinance Bank|51429",
		"Springville MFB|51395",
		"Stanbic IBTC Bank|221",
		"Standard Chartered Bank|068",
		"STANFORD MICROFINANCE BANK|090162",
		"STATESIDE MICROFINANCE BANK|50809",
		"STB Mortgage Bank|070022",
		"Stellas MFB|51253",
		"Sterling Bank|232",
		"Summit Bank|00305",
		"Suntrust Bank|100",
		"Supreme MFB|50968",
		"TAJ Bank|302",
		"Tangerine Money|51269",
		"Tatum Bank|109",
		"Tatum Bank Ltd|00109",
		"TENN|51403",
		"Think Finance Microfinance Bank|677",
		"Titan Bank|102",
		"TransPay MFB|090708",
		"TRUSTBANC J6 MICROFINANCE BANK|51118",
		"U and C MFB|50840",
		"U&C Microfinance Bank Ltd (U AND C MFB)|50840",
		"UBJ Microfinance Bank Limited|51396",
		"UCEE MFB|090706",
		"Uhuru MFB|51322",
		"Ultraviolet Microfinance Bank|51080",
		"Umunnachi Microfinance Bank Ltd|51097",
		"Unaab Microfinance Bank Limited|50870",
		"UNIABUJA MFB|51447",
		"Unical MFB|50871",
		"Unilag Microfinance Bank|51316",
		"UNIMAID MICROFINANCE BANK|50875",
		"Union Bank of Nigeria|032",
		"United Bank For Africa|033",
		"Unity Bank|215",
		"UNIUYO Microfinance Bank Ltd|50880",
		"Uzondu Microfinance Bank Awka Anambra State|50894",
		"Vale Finance Limited|050020",
		"VFD Microfinance Bank Limited|566",
		"Victory MFB|51085",
		"Waya Microfinance Bank|51355",
		"Wema Bank|035",
		"Weston Charis MFB|51386",
		"Whitecrust Finance Company|402001",
		"Xpress Wallet|100040",
		"YCT MFB|51253",
		"Yes MFB|594",
		"Zap|00zap",
		"Zenith Bank|057",
		"Zitra MFB|51373"
	];

	function normalise(value) {
		return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
	}

	var banks = RAW.map(function (row) {
		var parts = row.split("|");
		return {
			name: parts[0],
			code: parts[1],
			search: normalise(parts[0]) + " " + normalise(normalise(parts[0]) + parts[1])
		};
	}).sort(function (a, b) {
		return a.name.localeCompare(b.name, "en");
	});

	function byCode(code) {
		return (
			banks.find(function (bank) {
				return bank.code === code;
			}) || null
		);
	}

	function byName(name) {
		var target = normalise(name);
		return (
			banks.find(function (bank) {
				return normalise(bank.name) === target;
			}) || null
		);
	}

	function search(query, limit) {
		var term = normalise(query);
		var max = limit || 60;
		if (!term) return banks.slice(0, max);

		var starts = [];
		var contains = [];

		banks.forEach(function (bank) {
			var name = normalise(bank.name);
			if (name.indexOf(term) === 0) starts.push(bank);
			else if (name.indexOf(term) > -1 || bank.code.toLowerCase().indexOf(term) === 0) contains.push(bank);
		});

		return starts.concat(contains).slice(0, max);
	}

	var FIRST_NAMES = [
		"Amaka", "Odinaka", "Chukwuma", "Ngozi", "Ifeanyi", "Tobiloba", "Adaeze", "Emeka",
		"Fatima", "Segun", "Blessing", "Kehinde", "Ikenna", "Halima", "Chiamaka", "Babajide",
		"Uchenna", "Yetunde", "Musa", "Oluwaseun", "Aisha", "Nonso", "Temitope", "Kelechi"
	];

	var LAST_NAMES = [
		"Obi", "Nwosu", "Eze", "Adeyemi", "Okonkwo", "Balogun", "Ibrahim", "Okafor",
		"Adebayo", "Umeh", "Danjuma", "Ojo", "Nwachukwu", "Bello", "Ekwueme", "Salami",
		"Chukwu", "Abubakar", "Onyeka", "Lawal"
	];

	function hash(value) {
		var total = 0;
		String(value).split("").forEach(function (character) {
			total = (total * 31 + character.charCodeAt(0)) % 1000003;
		});
		return total;
	}

	// Stand-in for the bank account resolution endpoint. Same input always
	// returns the same name so a refresh never changes a recipient.
	function resolveAccount(accountNumber) {
		var digits = String(accountNumber || "").replace(/\D/g, "");
		if (digits.length !== 10) return null;
		var seed = hash(digits);
		var first = FIRST_NAMES[seed % FIRST_NAMES.length];
		var middle = LAST_NAMES[(seed >> 4) % LAST_NAMES.length];
		var last = LAST_NAMES[(seed >> 8) % LAST_NAMES.length];
		return (first + " " + middle.charAt(0) + ". " + last).toUpperCase();
	}

	// Beetags that exist in the demo directory resolve to their real holder.
	var DIRECTORY = {
		chinedue: "CHINEDU EZE",
		amakaobi: "AMAKA J. OBI",
		odinaka: "ODINAKA NWOSU",
		chukwumae: "CHUKWUMA EZE",
		ngoziadeyemi: "NGOZI ADEYEMI",
		ngozi: "NGOZI ADEYEMI",
		tochukwu: "TOCHUKWU EKWUEME"
	};

	function resolveHandle(handle) {
		var cleaned = String(handle || "").trim().replace(/^@/, "");
		if (cleaned.length < 3) return null;
		if (DIRECTORY[cleaned.toLowerCase()]) return DIRECTORY[cleaned.toLowerCase()];
		var seed = hash(cleaned.toLowerCase());
		var first = FIRST_NAMES[seed % FIRST_NAMES.length];
		var last = LAST_NAMES[(seed >> 5) % LAST_NAMES.length];
		return (first + " " + last).toUpperCase();
	}

	function isHandle(value) {
		return /^@?[a-z][a-z0-9._]{2,}$/i.test(String(value).trim()) && !/^\d+$/.test(String(value).trim());
	}

	window.Bee = window.Bee || {};
	window.Bee.banks = {
		all: banks,
		search: search,
		byCode: byCode,
		byName: byName,
		resolveAccount: resolveAccount,
		resolveHandle: resolveHandle,
		isHandle: isHandle
	};
})(window);
