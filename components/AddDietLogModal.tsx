import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { MealType, FoodItem } from '../App';

interface AddEditDietLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (foodData: { foodName: string, calories: number }, originalFoodItem: FoodItem | null) => Promise<void>;
    mealType: MealType | null;
    foodItemToEdit: FoodItem | null;
}

const AddEditDietLogModal: React.FC<AddEditDietLogModalProps> = ({ isOpen, onClose, onSave, mealType, foodItemToEdit }) => {
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState<number | ''>('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (foodItemToEdit) {
                setFoodName(foodItemToEdit.foodName);
                setCalories(foodItemToEdit.calories);
            } else {
                setFoodName('');
                setCalories('');
            }
            setError('');
            setIsSaving(false);
        }
    }, [isOpen, foodItemToEdit]);

    const mealTypeToKorean = (type: MealType | null) => {
        switch (type) {
            case 'breakfast': return '아침';
            case 'lunch': return '점심';
            case 'dinner': return '저녁';
            case 'snacks': return '간식';
            default: return '';
        }
    };
    
    const modalTitle = foodItemToEdit 
        ? `${mealTypeToKorean(mealType)} 식단 수정` 
        : `${mealTypeToKorean(mealType)} 식단 추가`;

    const handleSubmit = async () => {
        if (!foodName.trim()) {
            setError('음식 이름을 입력해주세요.');
            return;
        }
        if (calories === '' || calories < 0) {
            setError('올바른 칼로리를 입력해주세요.');
            return;
        }
        
        setIsSaving(true);
        setError('');
        try {
            await onSave({ foodName: foodName.trim(), calories: Number(calories) }, foodItemToEdit);
        } catch (e) {
            setError('저장에 실패했습니다. 다시 시도해주세요.');
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <div className="space-y-4">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div>
                    <label htmlFor="foodName" className="block text-sm font-medium text-gray-300 mb-1">음식 이름</label>
                    <input
                        id="foodName"
                        type="text"
                        value={foodName}
                        onChange={e => setFoodName(e.target.value)}
                        placeholder="예: 닭가슴살 샐러드"
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                </div>
                <div>
                    <label htmlFor="calories" className="block text-sm font-medium text-gray-300 mb-1">칼로리 (kcal)</label>
                    <input
                        id="calories"
                        type="number"
                        value={calories}
                        onChange={e => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="예: 350"
                        className="w-full bg-dark p-2 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                    <button onClick={onClose} disabled={isSaving} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
                        취소
                    </button>
                    <button onClick={handleSubmit} disabled={isSaving} className="bg-secondary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSaving ? '저장 중...' : (foodItemToEdit ? '수정하기' : '추가하기')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AddEditDietLogModal;