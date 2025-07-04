const List = require('../models/List');
const Household = require('../models/Household');
const { getIO } = require('../config/socket');

// Create a new shopping list
exports.createList = async (req, res) => {
  try {
    const { name, householdId } = req.body;
    const userId = req.userId;

    const household = await Household.findById(householdId);
    if (!household) {
      return res.status(404).json({ error: 'Household not found' });
    }

    const newList = new List({ name, household: householdId });
    await newList.save();

    // Update household with new list
    household.lists.push(newList._id);
    await household.save();

    // Notify household members via Socket.io
    const io = getIO();
    io.to(householdId).emit('list-created', newList);

    res.status(201).json(newList);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Add item to list (with real-time updates)
exports.addItem = async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, quantity, price } = req.body;
    const userId = req.userId;

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    const newItem = { name, quantity, price, addedBy: userId };
    list.items.push(newItem);
    await list.save();

    // Broadcast update to all household members
    const io = getIO();
    io.to(list.household.toString()).emit('list-updated', list);

    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};