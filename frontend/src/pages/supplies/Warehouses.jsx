import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Warehouses = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (user.role !== 'Supplies Manager' && user.role !== 'Admin' && user.role !== 'Accountant') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadWarehouses();
  }, [navigate]);

  const loadWarehouses = () => {
    setLoading(true);
    
    // Загрузка складов
    const warehousesData = JSON.parse(localStorage.getItem('warehouses') || '[]');
    if (warehousesData.length === 0) {
      // Демо данные если нет складов
      const demoWarehouses = [
        { id: '1', name: 'Основной склад', location: 'г. Москва', phone: '+111222333' },
        { id: '2', name: 'Региональный склад', location: 'г. Санкт-Петербург', phone: '+444555666' },
        { id: '3', name: 'Филиал №3', location: 'г. Новосибирск', phone: '+777888999' }
      ];
      localStorage.setItem('warehouses', JSON.stringify(demoWarehouses));
      setWarehouses(demoWarehouses);
    } else {
      setWarehouses(warehousesData);
    }
    
    setLoading(false);
  };

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Список складов</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Таблица складов */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Локация
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warehouses.length > 0 ? (
                warehouses.map((warehouse, index) => (
                  <tr key={warehouse.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {warehouse.phone}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Нет доступных складов
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

export default Warehouses;