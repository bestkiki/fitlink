import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusCircleIcon, SparklesIcon } from '../components/icons';
import { MealType } from '../App';
import Modal from '../components/Modal';

// --- TYPE DEFINITIONS ---
interface FoodInfo {
    food_name: string;
    calories: number;
    serving_size: string;
}

interface CalorieSearchPageProps {
    onBack: () => void;
    onAddFood: (mealType: MealType, foodName: string, calories: number) => Promise<void>;
}

interface AddToMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    food: FoodInfo;
    onAdd: (mealType: MealType) => void;
}


// --- COMPONENTS ---
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

const CalorieSearchPage: React.FC<CalorieSearchPageProps> = ({ onBack, onAddFood }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<FoodInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFood, setSelectedFood] = useState<FoodInfo | null>(null);
    
    // NOTE: This assumes process.env.API_KEY is set in the build environment (e.g., Vercel).
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        const prompt = `Please provide calorie information for the food: "${searchTerm}". The information should be in Korean. Return the result as a JSON array of objects. Each object should have three fields: "food_name" (string), "calories" (number, rounded to the nearest integer), and "serving_size" (string, e.g., "1개", "100g"). Provide up to 5 relevant results. If no relevant food is found, return an empty array.`;
        
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                food_name: { type: Type.STRING },
                                calories: { type: Type.INTEGER },
                                serving_size: { type: Type.STRING },
                            },
                        },
                    },
                },
            });
            
            const jsonString = response.text.trim();
            const data: FoodInfo[] = JSON.parse(jsonString);

            if (data && data.length > 0) {
                setResults(data);
            } else {
                setError('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
            }

        } catch (err) {
            console.error("Gemini API Error:", err);
            setError('칼로리 정보를 검색하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToMeal = async (mealType: MealType) => {
        if (!selectedFood) return;
        
        await onAddFood(mealType, selectedFood.food_name, selectedFood.calories);
        alert(`'${selectedFood.food_name}'이(가) 오늘의 식단에 추가되었습니다.`);
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
                    <SparklesIcon className="w-8 h-8 mr-3 text-secondary"/>
                    AI 음식 칼로리 검색
                </h1>
                <p className="text-gray-400 mb-8">음식 이름을 검색하여 칼로리 정보를 확인하고 식단에 추가하세요.</p>

                <form onSubmit={handleSearch} className="flex items-center space-x-2 mb-8 max-w-lg">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="예: 바나나 1개, 신라면..."
                        className="w-full bg-dark-accent p-3 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                    <button type="submit" disabled={loading} className="bg-secondary hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-600">
                        {loading ? '검색중...' : '검색'}
                    </button>
                </form>

                <div className="space-y-4 max-w-lg">
                    {error && <p className="text-center text-red-400 bg-red-500/10 p-4 rounded-lg">{error}</p>}
                    
                    {results.map((food, index) => (
                        <div key={index} className="bg-dark-accent p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white">{food.food_name}</h3>
                                <p className="text-sm text-gray-400">
                                    <span className="font-semibold text-secondary">{food.calories} kcal</span> / {food.serving_size}
                                </p>
                            </div>
                            <button 
                                onClick={() => setSelectedFood(food)}
                                className="flex items-center space-x-2 bg-dark hover:bg-secondary/20 text-secondary font-bold py-2 px-3 rounded-lg transition-colors text-sm border border-secondary/50"
                            >
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>추가</span>
                            </button>
                        </div>
                    ))}
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
