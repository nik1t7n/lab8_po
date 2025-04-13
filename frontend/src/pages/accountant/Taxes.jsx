import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Taxes = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [formData, setFormData] = useState({
    name: '',
    rate: 0.1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли
    if (user.role !== 'Accountant' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadTaxes();
  }, [navigate]);

  const loadTaxes = () => {
    setLoading(true);
    
    // Получаем данные о налогах
    const taxesData = JSON.parse(localStorage.getItem('taxes') || '[]');
    
    // Если нет данных о налогах, добавляем демо-данные
    if (taxesData.length === 0) {
      const demoTaxes = [
        { id: '1', name: 'НДС', rate: 0.12, startDate: '2023-01-01', endDate: '2025-12-31' },
        { id: '2', name: 'Налог на прибыль', rate: 0.10, startDate: '2023-01-01', endDate: '2025-12-31' },
        { id: '3', name: 'Социальные отчисления', rate: 0.17, startDate: '2023-01-01', endDate: '2025-12-31' }
      ];
      localStorage.setItem('taxes', JSON.stringify(demoTaxes));
      setTaxes(demoTaxes);
    } else {
      setTaxes(taxesData);
    }
    
    setLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'rate') {
      const rateValue = parseFloat(value);
      if (!isNaN(rateValue) && rateValue >= 0 && rateValue <= 1) {
        setFormData(prev => ({ ...prev, [name]: rateValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.name.trim()) {
      setError('Введите название налога');
      return;
    }
    
    if (formData.rate <= 0 || formData.rate > 1) {
      setError('Ставка налога должна быть от 0 до 1');
      return;
    }
    
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate < startDate) {
      setError('Дата окончания должна быть позже даты начала');
      return;
    }
    
    if (editMode) {
      // Обновление существующего налога
      const updatedTaxes = taxes.map(tax => 
        tax.id === editId ? { ...formData, id: editId } : tax
      );
      setTaxes(updatedTaxes);
      localStorage.setItem('taxes', JSON.stringify(updatedTaxes));
      
      // Сброс режима редактирования
      setEditMode(false);
      setEditId(null);
    } else {
      // Создание нового налога
      const newTax = {
        id: Date.now().toString(),
        ...formData
      };
      
      const updatedTaxes = [...taxes, newTax];
      setTaxes(updatedTaxes);
      localStorage.setItem('taxes', JSON.stringify(updatedTaxes));
    }
    
    // Сброс формы
    setFormData({
      name: '',
      rate: 0.1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]
    });
    
    setShowForm(false);
    setError('');
  };

  const handleEdit = (tax) => {
    setFormData({
      name: tax.name,
      rate: tax.rate,
      startDate: tax.startDate,
      endDate: tax.endDate
    });
    
    setEditMode(true);
    setEditId(tax.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = (taxId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот налог?')) {
      const updatedTaxes = taxes.filter(tax => tax.id !== taxId);
      setTaxes(updatedTaxes);
      localStorage.setItem('taxes', JSON.stringify(updatedTaxes));
    }
  };

  const handleFilterChange = (filterValue) => {
    setFilter(filterValue);
  };

  // Фильтрация налогов
  const filteredTaxes = taxes.filter(tax => {
    const currentDate = new Date();
    const startDate = new Date(tax.startDate);
    const endDate = new Date(tax.endDate);
    const isActive = currentDate >= startDate && currentDate <= endDate;
    
    if (filter === 'all') return true;
    if (filter === 'active') return isActive;
    if (filter === 'inactive') return !isActive;
    
    return true;
  });

  // Если данные загружаются
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto"></div>
          <p className="mt-3 text-gray-700">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Налоги</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры и кнопка добавления */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex space-x-2 mb-2 sm:mb-0">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'all' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Все налоги
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'active' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Активные
              </button>
              <button
                onClick={() => handleFilterChange('inactive')}
                className={`px-4 py-2 rounded-lg ${
                  filter === 'inactive' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Неактивные
              </button>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (editMode) {
                  setEditMode(false);
                  setEditId(null);
                  setFormData({
                    name: '',
                    rate: 0.1,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0]
                  });
                }
              }}
              className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Отменить' : 'Добавить налог'}
            </button>
          </div>
        </div>

        {/* Форма добавления/редактирования налога */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editMode ? 'Редактирование налога' : 'Добавление нового налога'}
            </h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Название налога
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Ставка налога (от 0 до 1)
                  </label>
                  <input
                    type="number"
                    id="rate"
                    name="rate"
                    value={formData.rate}
                    onChange={handleFormChange}
                    required
                    min="0"
                    max="1"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {(formData.rate * 100).toFixed(1)}%
                  </p>
                </div>
                
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Дата окончания
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editMode ? 'Обновить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Таблица налогов */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название налога
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ставка
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата начала
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата окончания
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTaxes.length > 0 ? (
                filteredTaxes.map((tax, index) => {
                  const currentDate = new Date();
                  const startDate = new Date(tax.startDate);
                  const endDate = new Date(tax.endDate);
                  const isActive = currentDate >= startDate && currentDate <= endDate;
                  
                  return (
                    <tr key={tax.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tax.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(tax.rate * 100).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tax.startDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tax.endDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Активный
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Неактивный
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                        <button
                          onClick={() => handleEdit(tax)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(tax.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Нет налогов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Taxes;