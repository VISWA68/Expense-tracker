const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const User = require('./models/User');
const Expense = require('./models/Expense');
const cors = require('cors');



const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Replace the following with your actual MongoDB Atlas connection string
const mongoURI = process.env.MONGO_URI || 'mongodb+srv://v:viswa@cluster0.dhc4mq5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use(bodyParser.json());


app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });

    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // User authenticated, send user's ID back to the client
    res.status(200).json({ userId: user._id }); // corrected this line
});


app.get('/api/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    // Fetch the user's details from the database using the user's object ID
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Return the user's name (or other details) to the client
    res.status(200).json({ name: user.name });
});


app.post('/api/logout', (req, res) => {
    
    res.sendStatus(200);
});




// Add expense
app.post('/api/expenses', async (req, res) => {
    const { title, date, amount, category, userId } = req.body;

    const expense = new Expense({ title, date, amount, category, user: userId });

    try {
        await expense.save();
        res.status(201).json({ message: 'Expense added successfully' });
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Failed to add expense' });
    }
});


// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
    const { userId } = req.body; // Extract userId from request body
    const expenseId = req.params.id;

    try {
        await Expense.findOneAndDelete({ _id: expenseId, user: userId });
        res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Failed to delete expense' });
    }
});


//getexpensetoedit
// Get expense by ID
app.get('/api/getexpenses/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.query.userId; // Assuming userId is sent in the query parameter

    try {
        const expense = await Expense.findOne({ _id: id, user: userId });
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.status(200).json(expense);
    } catch (error) {
        console.error('Error fetching expense:', error);
        res.status(500).json({ message: 'Failed to fetch expense' });
    }
});



// Update expense
app.put('/api/expenses/:id', async (req, res) => {
    const { title, date, amount, category, userId } = req.body;
    const expenseId = req.params.id;

    try {
        await Expense.findOneAndUpdate({ _id: expenseId, user: userId }, { title, date, amount, category });
        res.status(200).json({ message: 'Expense updated successfully' });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Failed to update expense' });
    }
});


// Get all expensesY
app.get('/api/expenses', async (req, res) => {
    const userId = req.query.userId; // Assuming userId is sent as a query parameter

    try {
        const expenses = await Expense.find({ user: userId });
        res.status(200).json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ message: 'Failed to fetch expenses' });
    }
});

// Get chart data
app.get('/api/expenses/chartData', async (req, res) => {
    const userId = req.query.userId; // Assuming userId is sent as a query parameter

    try {
        const expenses = await Expense.find({ user: userId });
        const categoryCounts = {};

        expenses.forEach(expense => {
            categoryCounts[expense.category] = (categoryCounts[expense.category] || 0) + expense.amount;
        });

        const labels = Object.keys(categoryCounts);
        const data = Object.values(categoryCounts);
        const backgroundColor = labels.map(() => '#' + (Math.random().toString(16) + '000000').slice(2, 8));

        res.status(200).json({ labels, data, backgroundColor });
    } catch (error) {
        console.error('Error fetching chart data:', error);
        res.status(500).json({ message: 'Failed to fetch chart data' });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
