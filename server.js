// server.js

const express = require('express');
const app = express();
const port = 3000;

// Example endpoint for fetching recipes
app.get('/api/recipes', async (req, res) => {
  try {
    // Replace with your logic to fetch recipes from a database or third-party API
    const recipes = [
      { title: 'Pasta Carbonara', description: 'A classic Italian pasta dish made with eggs, cheese, pancetta, and pepper.' },
      { title: 'Chicken Curry', description: 'A flavorful chicken curry with a rich and spicy sauce.' },
      // Add more recipes as needed
    ];
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching recipes' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
