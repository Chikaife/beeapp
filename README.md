# beeapp

Wallet front end for a Nigerian payments product: airtime, data, bill payments,
betting wallet funding, transfers, deposits and withdrawals to any Nigerian bank.

Static HTML, CSS and vanilla JavaScript. No build step, no dependencies beyond
two webfont families and Lucide icons loaded from a CDN.

## Pages

| File | Screen |
| --- | --- |
| `index.html` | Sign in |
| `signup.html` | Create account — details, password, phone verification |
| `reset-password.html` | Reset password — identify, verify, new password |
| `dashboard.html` | Overview — balance, services, recent activity |
| `wallet.html` | Withdraw, transfer and deposit (`?mode=withdraw\|transfer\|deposit`) |
| `services.html` | Airtime, data, bills and betting (`?service=airtime\|data\|bill\|betting`) |
| `transactions.html` | Statement with filters, receipts and CSV export |

## Structure

```
styles/
  base.css      tokens, typography, buttons, form controls
  app.css       application shell and screens
  auth.css      sign in, sign up and password reset
js/
  core.js       wallet state, money and date formatting, seeded records
  banks.js      Nigerian bank directory (269 entries) and account resolution
  shell.js      signed-in identity, balance syncing, mobile drawer
  ledger.js     shared transaction row renderer
  receipt.js    receipt dialog
  overview.js   dashboard
  transactions.js  statement, filters, CSV export
  money.js      withdraw, transfer and deposit flows
  services.js   airtime, data, bills and betting flows
  auth.js       sign in, sign up and reset flows
```

## Running

Any static server works:

```
python -m http.server 8000
```

Then open `http://localhost:8000/`. Opening the files directly with `file://`
also works, but `localStorage` is scoped per file origin, so use the server if
balances look reset between pages.

## Data

Wallet state lives in `localStorage` under `beeapp.wallet.v1` and is seeded on
first load with a demo balance, eight historical transactions and three saved
bank accounts. Payments made in the UI write to the same store, so the balance,
the ledger and the statement stay consistent.

Bank names and CBN codes in `js/banks.js` come from
`gradarr_paystack_banks.csv`. `Bee.banks.resolveAccount()` is a deterministic
stand-in for the account-name lookup endpoint — identical input always returns
the same name, and any account number ending in `0000` fails resolution so the
error state can be reviewed.
