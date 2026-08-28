let firstName = document.querySelector("#firstname")
let lastName = document.querySelector("#lastname")
let Email = document.querySelector("#email")
let user = document.querySelector(".username-btn")
let ports = document.querySelectorAll(".user-name")

// login page
if (Email) {
    let login = document.querySelector(".btn-primary")

    login.addEventListener("click", function () {
        localStorage.setItem("Email", Email.value)
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
if (user && ports.length > 0) {
    function showname() {
        let AccessType = localStorage.getItem("AccessType")

        if (ports[0].textContent === "") {

            if (AccessType === "signup") {
                let savedFName = localStorage.getItem("firstName")
                let savedLName = localStorage.getItem("lastName")

                ports.forEach(function (port) {
                    port.textContent = savedFName + " " + savedLName
                })

                user.textContent = "Hide name"

            } else if (AccessType === "login") {
                let savedEmail = localStorage.getItem("Email")

                ports.forEach(function (port) {
                    port.textContent = savedEmail
                })

                user.textContent = "Hide name"
            }

        } else {

            ports.forEach(function (port) {
                port.textContent = ""
            })

            user.textContent = "Show name"
        }
    }
}
// //////////////////////////////////////

const transactionAmounts = document.querySelectorAll('.transaction-amount');

transactionAmounts.forEach(transactionAmount => {
    // const Amount = parseFloat(transactionAmount.textContent.replace(/[^0-9.-]+/g, '')
    // )
const Amount = parseFloat(transactionAmount.textContent.replace("₦", ''))

    if (Amount > 0) {
    transactionAmount.style.color = "#3f9b67";
    } else {
    transactionAmount.style.color = "black";
    }
});

function updateDateTime() {
const now = new Date();

document.querySelector('.date-stamp').textContent = now.toLocaleDateString('en-US');
document.querySelector('.time-stamp').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

updateDateTime();
setInterval(updateDateTime, 1000); 
