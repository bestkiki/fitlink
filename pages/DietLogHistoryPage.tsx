import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ArrowLeftIcon, ClipboardListIcon, FireIcon, PlusCircleIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '../components/icons';
import { UserProfile, DietLog, MealType, FoodItem } from '../App';
import firebase from 'firebase/compat/app';
import AddEditDietLogModal from '../components/AddDietLogModal';

interface DietLogHistoryPageProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
    onNavigateToCalorieSearch: () => void;
}

const DietLogHistoryPage: React.FC<DietLogHistoryPageProps> = ({ user, userProfile, onBack, onNavigateToCalorieSearch }) => {
    const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
    const [editingMealType, setEditingMealType] = useState<MealType | null>(null);
    const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('users').doc(user.uid).collection('dietLogs')
            .orderBy('date', 'desc')
            .onSnapshot(snapshot => {
                const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DietLog));
                setDietLogs(logs);
                setLoading(false);
            }, error => {
                console.error("Error fetching diet logs:", error);
                setLoading(false);
            });
        return () => unsubscribe();
    }, [user.uid]);

    const handleOpenAddModal = (logDate: string, mealType: MealType) => {
        setEditingLogDate(logDate);
        setEditingMealType(mealType);
        setEditingFoodItem(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (logDate: string, mealType: MealType, foodItem: FoodItem) => {
        setEditingLogDate(logDate);
        setEditingMealType(mealType);
        setEditingFoodItem(foodItem);
        setIsModalOpen(true);
    };

    const handleSaveFoodItem = async (foodData: { foodName: string; calories: number }, originalFoodItem: FoodItem | null) => {
        if (!editingMealType || !editingLogDate) return;
        
        const docRef = db.collection('users').doc(user.uid).collection('dietLogs').doc(editingLogDate);

        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(docRef);
                if (!doc.exists) {
                    // This case should ideally be handled if user can add to a non-existent past date
                    // For now, we assume adding is only for today or existing logs.
                    const newFoodItem: FoodItem = { id: Date.now().toString(), ...foodData };
                    const initialMeals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                    initialMeals[editingMealType!] = [newFoodItem];
                    transaction.set(docRef, {
                        date: editingLogDate,
                        meals: initialMeals,
                        totalCalories: foodData.calories,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } else {
                    const currentData = doc.data() as DietLog;
                    const meals = currentData.meals;
                    let calorieChange = 0;

                    if (originalFoodItem) { // Editing
                        const mealItems = meals[editingMealType!];
                        const itemIndex = mealItems.findIndex(item => item.id === originalFoodItem.id);
                        if (itemIndex > -1) {
                            calorieChange = foodData.calories - mealItems[itemIndex].calories;
                            mealItems[itemIndex] = { ...mealItems[itemIndex], ...foodData };
                        }
                    } else { // Adding
                        const newFoodItem: FoodItem = { id: Date.now().toString(), ...foodData };
                        meals[editingMealType!].push(newFoodItem);
                        calorieChange = foodData.calories;
                    }
                    
                    transaction.update(docRef, {
                        meals,
                        totalCalories: firebase.firestore.FieldValue.increment(calorieChange),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                }
            });
        } catch (error) {
            console.error("Error saving food item: ", error);
            alert("식단 저장에 실패했습니다.");
        } finally {
            setIsModalOpen(false);
        }
    };

    const handleDeleteFoodItem = async (logDate: string, mealType: MealType, foodItem: FoodItem) => {
        const docRef = db.collection('users').doc(user.uid).collection('dietLogs').doc(logDate);
        try {
            await docRef.update({
                [`meals.${mealType}`]: firebase.firestore.FieldValue.arrayRemove(foodItem),
                totalCalories: firebase.firestore.FieldValue.increment(-foodItem.calories),
            });
        } catch (error) {
            console.error("Error deleting food item: ", error);
            alert("식단 삭제에 실패했습니다.");
        }
    };
    
    const mealTypes: { key: MealType, name: string }[] = [
      { key: 'breakfast', name: '아침' },
      { key: 'lunch', name: '점심' },
      { key: 'dinner', name: '저녁' },
      { key: 'snacks', name: '간식' },
    ];
    
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <>
            <div className="container mx-auto px-6 py-12">
                <button onClick={onBack} className="flex items-center space-x-2 text-secondary mb-6 hover:underline">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>대시보드로 돌아가기</span>
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center">
                            <ClipboardListIcon className="w-8 h-8 mr-3 text-secondary"/>
                            식단 기록 관리
                        </h1>
                        <p className="text-gray-400">지난 식단 기록을 확인하고 관리할 수 있습니다.</p>
                    </div>
                    <button 
                        onClick={onNavigateToCalorieSearch}
                        className="flex items-center space-x-2 bg-secondary/80 hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors mt-4 sm:mt-0"
                    >
                        <MagnifyingGlassIcon className="w-5 h-5"/>
                        <span>칼로리 검색하기</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {loading && <p className="text-center text-gray-400">기록을 불러오는 중...</p>}
                    {!loading && dietLogs.length === 0 && (
                        <div className="bg-dark-accent p-8 rounded-lg shadow-lg text-center">
                            <p className="text-gray-400">아직 기록된 식단이 없습니다.</p>
                        </div>
                    )}
                    {dietLogs.map(log => (
                        <div key={log.id} className="bg-dark-accent p-6 rounded-lg shadow-lg">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                                <h2 className="text-xl font-bold text-white">{new Date(log.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</h2>
                                <div className="flex items-center space-x-2">
                                    <FireIcon className="w-6 h-6 text-secondary"/>
                                    <p className="text-2xl font-bold text-secondary">{log.totalCalories} <span className="text-sm text-gray-400">kcal</span></p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {mealTypes.map(meal => (
                                    <div key={meal.key}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-gray-300">{meal.name}</h3>
                                            <button onClick={() => handleOpenAddModal(log.date, meal.key)} className="p-1 text-secondary hover:text-orange-400">
                                                <PlusCircleIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                        <div className="space-y-1 text-sm">
                                            {log.meals[meal.key]?.length > 0 ? (
                                                log.meals[meal.key].map(food => (
                                                    <div key={food.id} className="flex justify-between items-center bg-dark p-2 rounded">
                                                        <span className="text-gray-300">{food.foodName}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-gray-400">{food.calories} kcal</span>
                                                            <button onClick={() => handleOpenEditModal(log.date, meal.key, food)} className="p-0.5"><PencilIcon className="w-4 h-4 text-gray-500 hover:text-primary"/></button>
                                                            <button onClick={() => handleDeleteFoodItem(log.date, meal.key, food)} className="p-0.5"><TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-400"/></button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 px-2">기록된 {meal.name} 식단이 없습니다.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {/* Add Today's log section if it doesn't exist */}
                    {!loading && !dietLogs.some(log => log.date === todayStr) && (
                         <div className="bg-dark-accent p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold text-white mb-4">{new Date(todayStr).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {mealTypes.map(meal => (
                                    <div key={meal.key}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-gray-300">{meal.name}</h3>
                                            <button onClick={() => handleOpenAddModal(todayStr, meal.key)} className="p-1 text-secondary hover:text-orange-400">
                                                <PlusCircleIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 px-2">기록된 {meal.name} 식단이 없습니다.</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <AddEditDietLogModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveFoodItem}
                mealType={editingMealType}
                foodItemToEdit={editingFoodItem}
            />
        </>
    );
};

export default DietLogHistoryPage;