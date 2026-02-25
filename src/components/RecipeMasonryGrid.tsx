
import React from 'react';
import RecipeCard from './RecipeCard';
import { Recipe } from '@/types';

interface RecipeMasonryGridProps {
    recipes: Recipe[];
    onRecipeClick: (recipe: Recipe) => void;
    onToggleFavorite?: (id: string) => void;
    showCategory?: boolean;
    onEdit?: (recipe: Recipe) => void;
    onDelete?: (recipe: Recipe) => void;
    onUpdateStatus?: (recipe: Recipe, status: 'published' | 'draft') => Promise<void>;
}

const RecipeMasonryGrid: React.FC<RecipeMasonryGridProps> = ({
    recipes,
    onRecipeClick,
    onToggleFavorite,
    showCategory,
    onEdit,
    onDelete,
    onUpdateStatus
}) => {
    return (
        <div className="columns-2 gap-4 space-y-4">
            {recipes.map((recipe, index) => (
                <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    index={index}
                    onClick={onRecipeClick}
                    onToggleFavorite={onToggleFavorite}
                    showCategory={showCategory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdateStatus={onUpdateStatus}
                />
            ))}
        </div>
    );
};

export default RecipeMasonryGrid;
