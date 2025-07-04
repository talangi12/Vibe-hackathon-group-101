const Expense = require('../models/Expense');
const Household = require('../models/Household');
const { getIO } = require('../config/socket');

// Split expenses after checkout
exports.splitExpenses = async (req, res) => {
  const { listId } = req.params;
  const userId = req.userId;

  try {
    const list = await List.findById(listId).populate('household');
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Verify household membership
    if (!list.household.members.includes(userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Calculate total from purchased items
    const total = list.items
      .filter(item => item.purchased)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create equal split
    const split = list.household.members.map(member => ({
      user: member,
      amount: total / list.household.members.length,
      paid: false,
    }));

    const expense = new Expense({
      household: list.household._id,
      list: list._id,
      total,
      split,
    });

    await expense.save();

    // Add to household
    list.household.expenses.push(expense._id);
    await list.household.save();

    // Notify household
    const io = getIO();
    io.to(list.household._id.toString()).emit('expense-created', expense);

    res.status(201).json(expense);
  } catch (err) {
    console.error('Split expense error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};