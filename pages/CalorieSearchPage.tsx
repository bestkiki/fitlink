import React, { useState } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusCircleIcon } from '../components/icons';
import { MealType } from '../App';
import Modal from '../components/Modal';

// Define the structure of a food item from the API
interface FatSecretFood {
    food_id: string;
    food_name: string;
    food_description: string;
}

// Props for the main component
interface CalorieSearchPageProps {
    onBack: () => void;
    onAddFood: (mealType: MealType, foodName: string, calories: number) => Promise<void>;
}

// Props for the "Add to Meal" modal
interface AddToMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    food: FatSecretFood & { calories: number };
    onAdd: (mealType: MealType) => void;
}

// A simple regex to parse calorie info from the description string
const parseCalories = (description: string): number | null => {
    const match = description.match(/Calories: (\d+(\.\d+)?)kcal/);
    return match ? Math.round(parseFloat(match[1])) : null;
};

// Modal component to select meal type
const AddToMealModal: React.FC<AddToMealModalProps> = ({ isOpen, onClose, food, onAdd }) => {
    const mealTypes: { key: MealType, name: string }[] = [
        { key: 'breakfast', name: '아침' },
        { key: 'lunch', name: '점심' },
        { key: 'dinner', name: '저녁' },
        { key: 'snacks', name: '간식' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`"${food.food_name}" 추가`}>
            <div>
                <p className="text-gray-300 mb-4">어떤 식사에 추가하시겠습니까?</p>
                <div className="grid grid-cols-2 gap-4">
                    {mealTypes.map(meal => (
                        <button
                            key={meal.key}
                            onClick={() => onAdd(meal.key)}
                            className="w-full bg-dark hover:bg-dark-accent text-white font-bold py-3 px-4 rounded-lg transition-colors border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                        >
                            {meal.name}
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

// Main page component
const CalorieSearchPage: React.FC<CalorieSearchPageProps> = ({ onBack, onAddFood }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<FatSecretFood[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFood, setSelectedFood] = useState<(FatSecretFood & { calories: number }) | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch(`/api/fatsecret?search=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '검색에 실패했습니다.');
            }
            const data = await response.json();
            
            if (data.foods && data.foods.food) {
                const foodArray = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];
                setResults(foodArray);
            } else {
                setError('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
            }

        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddClick = (food: FatSecretFood) => {
        const calories = parseCalories(food.food_description);
        if (calories !== null) {
            setSelectedFood({ ...food, calories });
        } else {
            alert("칼로리 정보를 파싱할 수 없습니다.");
        }
    };

    const handleAddToMeal = async (mealType: MealType) => {
        if (!selectedFood) return;
        
        await onAddFood(mealType, selectedFood.food_name, selectedFood.calories);
        setSelectedFood(null); 
    };

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>식단 기록으로 돌아가기</span>
                </button>

                <h1 className="text-3xl font-bold mb-2 flex items-center">
                    <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-secondary"/>
                    음식 칼로리 검색
                </h1>
                <p className="text-gray-400 mb-8">음식 이름을 검색하여 칼로리 정보를 확인하고 식단에 추가하세요.</p>

                <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-8 max-w-lg">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="예: 사과, 닭가슴살..."
                        className="w-full bg-dark-accent p-3 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <button type="submit" disabled={loading} className="bg-secondary hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600">
                        {loading ? '검색중...' : '검색'}
                    </button>
                </form>

                <div className="space-y-4 max-w-lg">
                    {error && <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>}
                    
                    {results.map(food => {
                        const calories = parseCalories(food.food_description);
                        return (
                            <div key={food.food_id} className="bg-dark-accent p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-white">{food.food_name}</h3>
                                    <p className="text-sm text-gray-400">{food.food_description}</p>
                                </div>
                                {calories !== null && (
                                    <button 
                                        onClick={() => handleAddClick(food)}
                                        className="flex items-center space-x-2 bg-dark hover:bg-secondary/20 text-secondary font-bold py-2 px-3 rounded-lg transition-colors text-sm border border-secondary/50"
                                    >
                                        <PlusCircleIcon className="w-5 h-5"/>
                                        <span>추가</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedFood && (
                <AddToMealModal
                    isOpen={!!selectedFood}
                    onClose={() => setSelectedFood(null)}
                    food={selectedFood}
                    onAdd={handleAddToMeal}
                />
            )}
        </>
    );
};

export default CalorieSearchPage;
