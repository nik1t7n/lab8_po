import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Discounts = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [promotions, setPromotions] = useState([]);
  const [customerDiscount, setCustomerDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('active'); // active, all, upcoming, past

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
    if (user.role !== 'Customer' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData(user);
  }, [navigate]);

  const loadInitialData = (user) => {
    setLoading(true);
    
    // Проверяем, есть ли у пользователя customerId
    if (!user.customerId) {
      const customers = JSON.parse(localStorage.getItem('customers') || '[]');
      
      // Если есть клиенты, назначаем первого из них
      if (customers.length > 0) {
        user.customerId = customers[0].id;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        // Создаем демо-клиента и назначаем его
        const demoCustomer = { 
          id: '1', 
          name: 'Иванов Иван', 
          phone: '+111222333', 
          email: 'ivanov@example.com', 
          discount: 5 
        };
        localStorage.setItem('customers', JSON.stringify([demoCustomer]));
        
        user.customerId = demoCustomer.id;
        localStorage.setItem('currentUser', JSON.stringify(user));
        setCurrentUser(user);
      }
    }
    
    // Загрузка данных о клиенте для получения персональной скидки
    loadCustomerData(user.customerId);
    
    // Загрузка акций
    loadPromotions();
  };

  const loadCustomerData = (customerId) => {
    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
    const customer = customers.find(c => c.id === customerId);
    
    if (customer) {
      setCustomerDiscount(customer.discount || 0);
    }
  };

  const loadPromotions = () => {
    const promotionsData = JSON.parse(localStorage.getItem('promotions') || '[]');
    
    // Если нет данных о акциях, создаем демо-данные
    if (promotionsData.length === 0) {
      const today = new Date();
      
      // Создаем акции: прошедшие, текущие и будущие
      const demoPromotions = [
        { 
          id: '1', 
          name: 'Летняя распродажа', 
          discount: 15, 
          startDate: '2023-06-01', 
          endDate: '2025-08-31',
          description: 'Скидки на все летние товары. Успейте приобрести товары для отдыха со скидкой!',
          conditions: 'Скидка распространяется на товары категории "Электроника" и "Аксессуары".'
        },
        { 
          id: '2', 
          name: 'Черная пятница', 
          discount: 30, 
          startDate: '2023-11-24', 
          endDate: '2025-11-27',
          description: 'Самые большие скидки года! Только 3 дня.',
          conditions: 'Количество товаров ограничено. Скидка не суммируется с другими акциями.'
        },
        { 
          id: '3', 
          name: 'Новогодние скидки', 
          discount: 20, 
          startDate: '2023-12-15', 
          endDate: '2025-12-31',
          description: 'Встречайте Новый год с новыми покупками!',
          conditions: 'Скидка действует при покупке от 3 товаров.'
        },
        { 
          id: '4', 
          name: 'Весенняя акция', 
          discount: 10, 
          startDate: '2025-03-01', 
          endDate: '2025-03-31',
          description: 'Обновление гардероба и техники к весне.',
          conditions: 'Скидка действует на все категории товаров.'
        },
        { 
          id: '5', 
          name: 'День защитника', 
          discount: 15, 
          startDate: '2023-02-20', 
          endDate: '2023-02-23',
          description: 'Специальные скидки к празднику!',
          conditions: 'Скидка действует на товары категории "Периферия".'
        }
      ];
      
      localStorage.setItem('promotions', JSON.stringify(demoPromotions));
      setPromotions(demoPromotions);
    } else {
      setPromotions(promotionsData);
    }
    
    setLoading(false);
  };

  // Функция для определения статуса акции
  const getPromotionStatus = (promotion) => {
    const currentDate = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (currentDate < startDate) {
      return 'upcoming';
    } else if (currentDate > endDate) {
      return 'past';
    } else {
      return 'active';
    }
  };

  // Фильтрация акций по статусу
  const filteredPromotions = promotions.filter(promotion => {
    if (filterStatus === 'all') return true;
    
    const status = getPromotionStatus(promotion);
    return status === filterStatus;
  });

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ru-RU', options);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Скидки по акциям</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Информация о персональной скидке */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Ваша персональная скидка: <span className="text-green-600">{customerDiscount}%</span></h2>
              <p className="text-sm text-gray-500 mt-1">
                Эта скидка применяется ко всем вашим заказам
              </p>
            </div>
            <div className="mt-2 sm:mt-0">
              <Link 
                to="/customer/order-details" 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
              >
                Создать заказ
              </Link>
            </div>
          </div>
        </div>

        {/* Фильтры для акций */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap space-x-2">
            <button
              onClick={() => setFilterStatus('active')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'active' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Активные акции
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'upcoming' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Предстоящие
            </button>
            <button
              onClick={() => setFilterStatus('past')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'past' 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Прошедшие
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`mb-2 px-4 py-2 rounded-lg ${
                filterStatus === 'all' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Все акции
            </button>
          </div>
        </div>

        {/* Акции */}
        {filteredPromotions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromotions.map(promotion => {
              const status = getPromotionStatus(promotion);
              
              // Определение стилей и текста в зависимости от статуса
              let statusClass = '';
              let statusText = '';
              if (status === 'active') {
                statusClass = 'bg-green-100 text-green-800';
                statusText = 'Активна';
              } else if (status === 'upcoming') {
                statusClass = 'bg-blue-100 text-blue-800';
                statusText = 'Предстоящая';
              } else {
                statusClass = 'bg-gray-100 text-gray-800';
                statusText = 'Завершена';
              }
              
              return (
                <div key={promotion.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{promotion.name}</h3>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-700">Скидка:</span>
                      <span className="font-medium text-green-600">{promotion.discount}%</span>
                    </div>
                    
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-700">Дата начала:</span>
                      <span className="font-medium">{formatDate(promotion.startDate)}</span>
                    </div>
                    
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-700">Дата окончания:</span>
                      <span className="font-medium">{formatDate(promotion.endDate)}</span>
                    </div>
                    
                    {promotion.description && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Описание:</h4>
                        <p className="text-sm text-gray-600">{promotion.description}</p>
                      </div>
                    )}
                    
                    {promotion.conditions && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Условия:</h4>
                        <p className="text-sm text-gray-600">{promotion.conditions}</p>
                      </div>
                    )}
                    
                    {status === 'active' && (
                      <div className="mt-6">
                        <Link 
                          to="/customer/order-details" 
                          className="w-full inline-block text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                        >
                          Заказать со скидкой
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">
              {filterStatus === 'active' ? 'Нет активных акций в данный момент.' :
               filterStatus === 'upcoming' ? 'Нет предстоящих акций.' :
               filterStatus === 'past' ? 'Нет прошедших акций.' : 'Нет доступных акций.'}
            </p>
          </div>
        )}

        {/* Информация о скидках */}
        <div className="bg-white shadow-md rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Как работают скидки</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>• При оформлении заказа автоматически применяется наибольшая доступная скидка.</p>
            <p>• Если в момент заказа действует акция с большей скидкой, чем ваша персональная, будет применена скидка по акции.</p>
            <p>• Скидки не суммируются, применяется только одна наибольшая скидка.</p>
            <p>• Некоторые акции могут иметь дополнительные условия, указанные в их описании.</p>
            <p>• Следите за обновлениями акций, чтобы не пропустить выгодные предложения!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discounts;