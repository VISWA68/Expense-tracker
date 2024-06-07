document.addEventListener('DOMContentLoaded', async () => {
    const userId = getUserIdFromURL();

    if (document.getElementById('username')) {
        if (userId) {
            // Fetch the user's name using the userId
            const response = await fetch(`http://localhost:3000/api/user/${userId}`);
            const data = await response.json();
            const userName = data.name;

            // Display the user's name
            document.getElementById('username').textContent = userName;

            // Fetch and display the user's expenses
            fetchExpenses(userId);
            fetchExpensesChart(userId);
        }
    }

    const addExpenseForm = document.getElementById('addExpenseForm');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const title = document.getElementById('expenseTitle').value;
            const date = document.getElementById('expenseDate').value;
            const amount = document.getElementById('expenseAmount').value;
            const category = document.getElementById('expenseCategory').value;

            const response = await fetch('http://localhost:3000/api/expenses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, date, amount, category, userId })
            });

            if (response.ok) {
                fetchExpenses(userId);
                fetchExpensesChart(userId);
            }
        });
    } else {
        console.error('addExpenseForm not found in the DOM');
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('http://localhost:3000/api/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
                if (response.ok) {
                    window.location.href = 'login.html'; // Redirect to the login page
                } else {
                    throw new Error('Failed to logout');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    } else {
        console.error('logoutBtn not found in the DOM');
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:3000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    const userId = data.userId; // Assuming the response contains userId
                    window.location.href = `index.html?userId=${userId}`; // Redirect to the main page with userId
                } else {
                    throw new Error('Failed to login');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    } else {
        console.error('loginForm not found in the DOM');
    }
});

function getUserIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
}

async function fetchExpenses(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/expenses?userId=${userId}`);
        const data = await response.json();
        const expensesList = document.getElementById('expenses');
        expensesList.innerHTML = '';
        data.forEach(expense => {
            const tr = document.createElement('tr');
            tr.id = `expense_${expense._id}`; // Set the ID of the row
            tr.innerHTML = `
                <td>${expense.title}</td>
                <td>${expense.date}</td>
                <td>${expense.amount}</td>
                <td>${expense.category}</td>
                <td class="actions">
                    <button onclick="editExpense('${expense._id}', '${userId}')" style="background-color: #90f4a4;" onMouseOver="this.style.backgroundColor='#4f9630'" onMouseOut="this.style.backgroundColor='#90f4a4'">Edit</button>
                    <button onclick="deleteExpense('${expense._id}', '${userId}')" style="background-color: #f09cac;" onMouseOver="this.style.backgroundColor='#a33a36'" onMouseOut="this.style.backgroundColor='#f09cac'">Delete</button>
                </td>
            `;
            expensesList.appendChild(tr);
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
    }
}

async function fetchExpensesChart(userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/expenses/chartData?userId=${userId}`);
        const data = await response.json();
        const ctx = document.getElementById('chart').getContext('2d');

        // Destroy existing chart if it exists
        if (window.myChart) {
            window.myChart.destroy();
        }

        window.myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: data.data,
                    backgroundColor: data.backgroundColor
                    
                }],
                options: {
                    plugins: {
                        legend: {
                            labels: {
                                color: 'white' // Set the legend text color
                            }
                        },
                        title: {
                            display: true,
                            text: 'Expenses by Category',
                            color: 'white' // Set the title text color
                        }
                    }
                }
                
            }
        });
    } catch (error) {
        console.error('Error fetching chart data:', error);
    }
}

async function deleteExpense(id, userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/expenses/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId }) // Send userId in the request body
        });
        if (response.ok) {
            fetchExpenses(userId);
            fetchExpensesChart(userId);
        } else {
            throw new Error('Failed to delete expense');
        }
    } catch (error) {
        console.error('Error deleting expense:', error);
    }
}

async function editExpense(id, userId) {
    try {
        const response = await fetch(`http://localhost:3000/api/getexpenses/${id}?userId=${userId}`);
        const expense = await response.json();

        // Display the form with the expense data
        displayEditForm(expense, id, userId);
    } catch (error) {
        console.error('Error editing expense:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString();
    let day = date.getDate().toString();

    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }

    return `${year}-${month}-${day}`;
}

function displayEditForm(expense, id, userId) {
    const expenseRow = document.querySelector(`#expense_${id}`);
    if (!expenseRow) {
        console.error('Element not found:', `#expense_${id}`);
        return;
    }

    const form = document.createElement('form');
    form.innerHTML = `
        <input type="text" id="editExpenseTitle" value="${expense.title}" required>
        <input type="date" id="editExpenseDate" value="${formatDate(expense.date)}" required>
        <input type="number" id="editExpenseAmount" value="${expense.amount}" required>
        <select id="editExpenseCategory" required>
            <option value="Food" ${expense.category === 'Food' ? 'selected' : ''}>Food</option>
            <option value="Movie" ${expense.category === 'Movie' ? 'selected' : ''}>Movie</option>
            <option value="Leisure" ${expense.category === 'Leisure' ? 'selected' : ''}>Leisure</option>
            <option value="Work" ${expense.category === 'Work' ? 'selected' : ''}>Work</option>
        </select>
        <button id="saveExpenseBtn" type="submit">Save</button>
    `;

    const tdActions = expenseRow.querySelector('.actions');
    if (tdActions) {
        tdActions.innerHTML = '';
        tdActions.appendChild(form);

        // Add event listener to the Save button
        const saveBtn = document.getElementById('saveExpenseBtn');
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const title = document.getElementById('editExpenseTitle').value;
            const date = document.getElementById('editExpenseDate').value;
            const amount = document.getElementById('editExpenseAmount').value;
            const category = document.getElementById('editExpenseCategory').value;

            // Send the PUT request to update the expense
            const updateResponse = await fetch(`http://localhost:3000/api/expenses/${id}?userId=${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, date, amount, category, userId })
            });

            if (updateResponse.ok) {
                fetchExpenses(userId);
                fetchExpensesChart(userId);
            } else {
                throw new Error('Failed to update expense');
            }
        });
    } else {
        console.error('Actions cell not found for expense:', id);
    }
}
