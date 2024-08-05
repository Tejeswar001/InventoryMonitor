// components/RecipeSuggestions.js

import { Box, Typography } from '@mui/material';

const RecipeSuggestions = ({ recipes }) => {
  return (
    <Box sx={{ width: '300px', padding: 2, borderLeft: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}>
      <Typography variant="h5" gutterBottom>Recipe Suggestions</Typography>
      {recipes.length > 0 ? (
        recipes.map((recipe, index) => (
          <Box key={index} sx={{ marginBottom: 2 }}>
            <Typography variant="h6">{recipe.title}</Typography>
            <Typography variant="body2">{recipe.description}</Typography>
          </Box>
        ))
      ) : (
        <Typography>No recipes found</Typography>
      )}
    </Box>
  );
};

export default RecipeSuggestions;
