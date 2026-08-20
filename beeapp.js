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
