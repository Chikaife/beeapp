const firstName = document.querySelector("#firstname")
const lastName = document.querySelector("#lastname")
const email = document.querySelector("#email")
const user = document.querySelector(".username-btn")
const namePlaces = document.querySelectorAll(".user-name")
const walletBalanceKey = "beeappDemoWalletBalance"
const walletActivityKey = "beeappDemoWalletActivity"
const startingBalance = 3344984.56

function getWalletBalance() {
    const savedBalance = localStorage.getItem(walletBalanceKey)

    if (savedBalance === null) {
        localStorage.setItem(walletBalanceKey, String(startingBalance))
        return startingBalance
    }

    const balance = Number(savedBalance)
    return Number.isFinite(balance) ? balance : startingBalance
}

function formatNaira(amount) {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function renderWalletBalance() {
    const balance = getWalletBalance()
    document.querySelectorAll("[data-wallet-balance]").forEach(function (element) {
        element.textContent = formatNaira(balance)
    })
}

function getWalletActivity() {
    try {
        const activity = JSON.parse(localStorage.getItem(walletActivityKey) || "[]")
        return Array.isArray(activity) ? activity : []
    } catch {
        return []
    }
}

function recordWalletActivity(title, amount, detail) {
    const activity = getWalletActivity()
    activity.unshift({ title, amount, detail, createdAt: new Date().toISOString() })
    localStorage.setItem(walletActivityKey, JSON.stringify(activity.slice(0, 20)))
    renderWalletActivity()
}

function renderWalletActivity() {
    const list = document.querySelector(".transaction-list")
    if (!list) return

    list.querySelectorAll("[data-demo-activity]").forEach(function (item) { item.remove() })
    getWalletActivity().forEach(function (activity, index) {
        const item = document.createElement("li")
        item.className = "transaction-item"
        item.dataset.demoActivity = String(index)

        const icon = document.createElement("span")
        icon.className = "transaction-icon"
        icon.textContent = activity.amount >= 0 ? "+" : "−"

        const copy = document.createElement("div")
        copy.className = "transaction-copy"
        const title = document.createElement("strong")
        title.textContent = activity.title
        const detail = document.createElement("span")
        detail.textContent = `${new Date(activity.createdAt).toLocaleDateString()} · ${activity.detail}`
        copy.append(title, detail)

        const amount = document.createElement("strong")
        amount.className = "transaction-amount"
        amount.textContent = `${activity.amount >= 0 ? "+" : "−"}${formatNaira(Math.abs(activity.amount))}`

        item.append(icon, copy, amount)
        list.insertBefore(item, list.firstChild)
    })
}

// login page
if (email) {
    let login = document.querySelector(".btn-primary")

    login.addEventListener("click", function () {
        localStorage.setItem("Email", email.value)
        localStorage.setItem("AccessType", "login")
    })
}


// signup page
if (firstName && lastName) {
    let signUp = document.querySelector(".btn-primary")

    signUp.addEventListener("click", function () {
        localStorage.setItem("firstName", firstName.value)
        localStorage.setItem("lastName", lastName.value)
        localStorage.setItem("AccessType", "signup")
    })
}


// dashboard
if (user && namePlaces.length > 0) {
    user.addEventListener("click", function () {
        const isShowing = namePlaces[0].textContent !== ""
        if (isShowing) {
            namePlaces.forEach(function (place) { place.textContent = "" })
            user.textContent = "Show name"
            return
        }

        const savedName = localStorage.getItem("AccessType") === "signup"
            ? `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim()
            : localStorage.getItem("Email") || ""
        namePlaces.forEach(function (place) { place.textContent = savedName })
        user.textContent = "Hide name"
    })
}

const profileButton = document.querySelector(".profile-button")
if (profileButton && user) {
    profileButton.addEventListener("click", function () { user.click() })
}

document.querySelectorAll("[data-service]").forEach(function (service) {
    service.addEventListener("click", function () {
        alert(`${service.dataset.service} is not available at the moment.`)
    })
})

const giftDialog = document.querySelector("#gift-dialog")
const giftButton = document.querySelector("#gift-user-button")
const giftForm = document.querySelector("#gift-form")

if (giftDialog && giftButton && giftForm) {
    giftButton.addEventListener("click", function () {
        document.querySelector("#gift-feedback").textContent = ""
        giftDialog.showModal()
    })

    document.querySelectorAll("[data-close-dialog]").forEach(function (button) {
        button.addEventListener("click", function () { giftDialog.close() })
    })

    giftForm.addEventListener("submit", function (event) {
        event.preventDefault()
        const recipient = document.querySelector("#gift-recipient").value.trim()
        const amount = Number(document.querySelector("#gift-amount").value)
        const feedback = document.querySelector("#gift-feedback")

        if (!recipient || !Number.isFinite(amount) || amount <= 0) {
            feedback.textContent = "Enter a recipient and a valid gift amount."
            return
        }
        if (amount > getWalletBalance()) {
            feedback.textContent = "Your wallet balance is too low for this gift."
            return
        }

        const message = document.querySelector("#gift-message").value.trim()
        const balance = Math.round((getWalletBalance() - amount) * 100) / 100
        localStorage.setItem(walletBalanceKey, String(balance))
        recordWalletActivity(`Virtual gift to ${recipient}`, -amount, message || "beeapp virtual gift")
        renderWalletBalance()
        feedback.textContent = `Virtual gift recorded for ${recipient}.`
        giftForm.reset()
    })
}

document.querySelectorAll("[data-wallet-mode]").forEach(function (button) {
    button.addEventListener("click", function () {
        const mode = button.dataset.walletMode
        const url = new URL(window.location.href)
        url.searchParams.set("mode", mode)
        window.history.replaceState({}, "", url)
        setWalletMode(mode)
    })
})

function setWalletMode(mode) {
    const validMode = mode === "withdraw" ? "withdraw" : "deposit"
    const title = document.querySelector("#wallet-title")
    const submit = document.querySelector("#wallet-submit")
    const activity = document.querySelector("#wallet-activity-label")
    if (!title || !submit) return

    title.textContent = validMode === "deposit" ? "Deposit to wallet" : "Withdraw from wallet"
    submit.textContent = validMode === "deposit" ? "Add funds" : "Withdraw funds"
    activity.textContent = validMode === "deposit" ? "Deposit" : "Withdrawal"
    document.querySelector("#wallet-mode").value = validMode
    const bankDetails = document.querySelector("#withdrawal-bank-details")
    if (bankDetails) {
        bankDetails.hidden = validMode !== "withdraw"
        bankDetails.querySelectorAll("input").forEach(function (input) {
            input.required = validMode === "withdraw"
            if (validMode === "deposit") input.value = ""
        })
    }
    document.querySelectorAll("[data-wallet-mode]").forEach(function (button) {
        const active = button.dataset.walletMode === validMode
        button.classList.toggle("is-active", active)
        button.setAttribute("aria-pressed", String(active))
    })
    document.querySelector("#wallet-feedback").textContent = ""
}

const walletForm = document.querySelector("#wallet-form")
if (walletForm) {
    setWalletMode(new URLSearchParams(window.location.search).get("mode"))
    walletForm.addEventListener("submit", function (event) {
        event.preventDefault()
        const amountInput = document.querySelector("#wallet-amount")
        const amount = Number(amountInput.value)
        const mode = document.querySelector("#wallet-mode").value
        const feedback = document.querySelector("#wallet-feedback")

        if (!Number.isFinite(amount) || amount <= 0) {
            feedback.textContent = "Enter an amount greater than zero."
            return
        }

        const signedAmount = mode === "deposit" ? amount : -amount
        const balance = Math.round((getWalletBalance() + signedAmount) * 100) / 100
        localStorage.setItem(walletBalanceKey, String(balance))
        recordWalletActivity(mode === "deposit" ? "Wallet deposit" : "Wallet withdrawal", signedAmount, "Wallet")
        renderWalletBalance()
        feedback.textContent = `${mode === "deposit" ? "Deposit" : "Withdrawal"} recorded.`
        walletForm.reset()
        document.querySelector("#wallet-mode").value = mode
        amountInput.focus()
    })
}

renderWalletBalance()
renderWalletActivity()

function updateDateTime() {
const now = new Date()
const dateStamp = document.querySelector(".date-stamp")
const timeStamp = document.querySelector(".time-stamp")

if (dateStamp) dateStamp.textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
if (timeStamp) timeStamp.textContent = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

updateDateTime()
if (document.querySelector(".date-stamp")) setInterval(updateDateTime, 1000)