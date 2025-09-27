import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusCircleIcon } from '../components/icons';
import { MealType } from '../App';
import Modal from '../components/Modal';

interface FoodCalorieInfo {
    foodName: string;
    calories: number;
    servingSize: string;
}

interface CalorieSearchPageProps {
    onBack: () => void;
    onAddFood: (mealType: MealType, foodName: string, calories: number) => Promise<void>;
}

const CalorieSearchPage: React.FC<CalorieSearchPageProps> = ({ onBack, onAddFood }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<FoodCalorieInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    const [foodToAdd, setFoodToAdd] = useState<FoodCalorieInfo | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);
        setSearched(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `For the food query "${searchTerm.trim()}", provide a list of relevant common food items and their approximate calorie information in Korean. The response must be a JSON object.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            foods: {
                                type: Type.ARRAY,
                                description: "A list of food items with their calorie information.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        foodName: { type: Type.STRING, description: "The name of the food item in Korean." },
                                        calories: { type: Type.NUMBER, description: "The estimated number of calories." },
                                        servingSize: { type: Type.STRING, description: "The serving size for the calorie count (e.g., '100g', '1개')." }
                                    },
                                    required: ["foodName", "calories", "servingSize"]
                                }
                            }
                        }
                    }
                }
            });

            const jsonText = response.text;
            const parsed = JSON.parse(jsonText);
            
            if (parsed.foods && Array.isArray(parsed.foods)) {
                setResults(parsed.foods);
            } else {
                 setResults([]);
            }

        } catch (err) {
            console.error("Calorie search error:", err);
            setError("칼로리 정보 검색에 실패했습니다. Gemini API 키가 올바르게 설정되었는지 확인해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddToMeal = async (mealType: MealType) => {
        if (!foodToAdd) return;
        setIsAdding(true);
        try {
            await onAddFood(mealType, foodToAdd.foodName, foodToAdd.calories);
            alert(`'${foodToAdd.foodName}'이(가) ${mealTypeToKorean(mealType)} 식단에 추가되었습니다.`);
            setFoodToAdd(null);
        } catch (e) {
            alert('식단 추가에 실패했습니다.');
        } finally {
            setIsAdding(false);
        }
    };

    const mealTypeToKorean = (type: MealType) => {
        const map = { breakfast: '아침', lunch: '점심', dinner: '저녁', snacks: '간식' };
        return map[type];
    };

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>식단 기록으로 돌아가기</span>
                </button>

                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2 flex items-center">
                        <MagnifyingGlassIcon className="w-8 h-8 mr-3 text-secondary"/>
                        AI 음식 칼로리 검색
                    </h1>
                    <p className="text-gray-400 mb-8">음식 이름을 검색하여 AI가 제공하는 칼로리 정보를 확인하고 식단에 추가하세요.</p>

                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="예: 신라면 1개, 스타벅스 아메리카노..."
                                className="w-full bg-dark-accent p-4 pl-12 rounded-lg text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                            <MagnifyingGlassIcon className="w-6 h-6 text-gray-500 absolute top-1/2 left-4 transform -translate-y-1/2"/>
                        </div>
                        <button type="submit" disabled={loading || !searchTerm.trim()} className="mt-4 w-full bg-secondary hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                            {loading ? '검색 중...' : '검색하기'}
                        </button>
                    </form>

                    <div className="bg-dark-accent p-6 rounded-lg shadow-lg min-h-[20rem]">
                        {loading ? (
                            <div className="flex justify-center items-center h-full pt-10">
                               <div className="w-12 h-12 border-4 border-t-4 border-gray-600 border-t-secondary rounded-full animate-spin"></div>
                            </div>
                        ) : error ? (
                            <p className="text-center text-red-400 pt-10">{error}</p>
                        ) : searched && results.length === 0 ? (
                            <p className="text-center text-gray-500 pt-10">"{searchTerm}"에 대한 검색 결과가 없습니다. 더 일반적인 검색어로 시도해보세요.</p>
                        ) : results.length > 0 ? (
                            <ul className="space-y-3">
                                {results.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center bg-dark p-3 rounded-md">
                                        <div>
                                            <p className="font-semibold text-white">{item.foodName}</p>
                                            <p className="text-sm text-gray-400">{item.servingSize}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <p className="font-bold text-lg text-secondary">{Math.round(item.calories)} <span className="text-sm text-gray-400">kcal</span></p>
                                            <button onClick={() => setFoodToAdd(item)} className="p-2 text-secondary hover:text-orange-400" title="식단에 추가">
                                                <PlusCircleIcon className="w-6 h-6"/>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-center text-gray-500 pt-10">검색할 음식 이름을 입력해주세요.</p>
                        )}
                    </div>
                </div>
            </div>

            {foodToAdd && (
                <Modal isOpen={!!foodToAdd} onClose={() => setFoodToAdd(null)} title={`'${foodToAdd.foodName}' 추가`}>
                     <p className="text-gray-300 mb-4">어떤 식사에 추가하시겠습니까?</p>
                     <div className="grid grid-cols-2 gap-3">
                        {(['breakfast', 'lunch', 'dinner', 'snacks'] as MealType[]).map(mealType => (
                            <button
                                key={mealType}
                                disabled={isAdding}
                                onClick={() => handleAddToMeal(mealType)}
                                className="w-full bg-dark hover:bg-dark-accent text-white font-semibold py-3 px-4 rounded-lg transition-colors border border-gray-600 disabled:opacity-50"
                            >
                                {mealTypeToKorean(mealType)}
                            </button>
                        ))}
                     </div>
                </Modal>
            )}
        </>
    );
};

export default CalorieSearchPage;