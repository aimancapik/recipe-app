
import React from 'react';
import RecipeCard from '@/components/recipe/RecipeCard';
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
    const left = recipes.filter((_, i) => i % 2 === 0);
    const right = recipes.filter((_, i) => i % 2 !== 0);

    return (
        <div className="flex gap-2.5">
            <div className="flex-1 flex flex-col gap-2.5">
                {left.map((recipe, index) => (
                    <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        index={index * 2}
                        onClick={onRecipeClick}
                        onToggleFavorite={onToggleFavorite}
                        showCategory={showCategory}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                    />
                ))}
            </div>
            <div className="flex-1 flex flex-col gap-2.5">
                {right.map((recipe, index) => (
                    <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        index={index * 2 + 1}
                        onClick={onRecipeClick}
                        onToggleFavorite={onToggleFavorite}
                        showCategory={showCategory}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onUpdateStatus={onUpdateStatus}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecipeMasonryGrid;
