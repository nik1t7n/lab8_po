import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ClientDebts = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debts, setDebts] = useState([]);
  const [customers, setCustomers] = useState({});
  const [filterStatus, setFilterStatus] = useState('all'); // all, debt, paid
  const [totalDebt, setTotalDebt] = useState(0);

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
    if (user.role !== 'Sales Manager' && user.role !== 'Admin' && user.role !== 'Accountant') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка клиентов
    const customersData = JSON.parse(localStorage.getItem('customers') || '[]');
    if (customersData.length === 0) {
      // Демо данные если нет клиентов
      const demoCustomers = [
        { id: '1', name: 'Иванов Иван', phone: '+111222333', email: 'ivanov@example.com' },
        { id: '2', name: 'Петрова Мария', phone: '+444555666', email: 'petrova@example.com' },
        { id: '3', name: 'Сидоров Алексей', phone: '+777888999', email: 'sidorov@example.com' }
      ];
      localStorage.setItem('customers', JSON.stringify(demoCustomers));
      
      const customersMap = {};
      demoCustomers.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      setCustomers(customersMap);
    } else {
      const customersMap = {};
      customersData.forEach(customer => {
        customersMap[customer.id] = customer;
      });
      setCustomers(customersMap);
    }
    
    // Загрузка заказов и платежей
    loadDebtsData();
  };

  const loadDebtsData = () => {
    // Получаем данные о заказах и платежах
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    
    // Создаем объект с задолженностями по заказам
    const debtsList = orders.map(order => {
      // Находим все платежи по данному заказу
      const orderPayments = payments.filter(payment => payment.orderId === order.id);
      const paidAmount = orderPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remainingDebt = Number(order.total) - paidAmount;
      
      // Дата дедлайна (для примера: +30 дней от даты заказа)
      const orderDate = new Date(order.date);
      const deadlineDate = new Date(orderDate);
      deadlineDate.setDate(deadlineDate.getDate() + 30);
      
      return {
        id: order.id,
        customerId: order.customerId,
        invoiceNumber: `INV-${order.id.substring(order.id.length - 6)}`,
        date: order.date,
        total: Number(order.total),
        paid: paidAmount,
        debt: remainingDebt,
        deadline: deadlineDate.toISOString().split('T')[0],
        status: remainingDebt > 0 ? 'debt' : 'paid'
      };
    });
    
    // Расчет общей задолженности
    const total = debtsList.reduce((sum, debt) => sum + debt.debt, 0);
    setTotalDebt(total);
    
    setDebts(debtsList);
    setLoading(false);
  };

  // Обработчик оплаты заказа
  const handlePayDebt = (debtId) => {
    // Для демонстрации: создаем новый платеж на всю сумму задолженности
    const debt = debts.find(d => d.id === debtId);
    
    if (!debt) return;
    
    // Создаем платеж
    const newPayment = {
      id: Date.now().toString(),
      orderId: debtId,
      amount: debt.debt,
      date: new Date().toISOString().split('T')[0],
      paymentType: 'cash',
      employeeId: currentUser.id
    };
    
    // Сохраняем платеж
    const payments = JSON.parse(localStorage.getItem('orderPayments') || '[]');
    localStorage.setItem('orderPayments', JSON.stringify([...payments, newPayment]));
    
    // Обновляем статус заказа как оплаченный
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = orders.map(order => {
      if (order.id === debtId) {
        return { ...order, isPaid: true };
      }
      return order;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
    
    // Обновляем данные на странице
    loadDebtsData();
    
    // Показываем сообщение об успешной оплате
    alert(`Платеж на сумму ${debt.debt.toFixed(2)} сом успешно выполнен!`);
  };

  // Фильтрация данных по статусу
  const filteredDebts = filterStatus === 'all' 
    ? debts 
    : debts.filter(debt => debt.status === filterStatus);

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
          <h1 className="text-2xl font-bold text-gray-900">Задолженности клиентов</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'all' 
                    ? 'bg-blue-800 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Все заказы
              </button>
              <button
                onClick={() => setFilterStatus('debt')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'debt' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                С задолженностью
              </button>
              <button
                onClick={() => setFilterStatus('paid')}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === 'paid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Оплаченные
              </button>
            </div>
            <div>
              <p className="text-lg font-medium">
                Общая задолженность: <span className="text-red-600 font-bold">{totalDebt.toFixed(2)} сом</span>
              </p>
            </div>
          </div>
        </div>

        {/* Таблица с задолженностями */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  № заказа
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата заказа
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма к оплате
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Фактическая сумма оплаты
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Задолженность
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата дедлайна платежа
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDebts.length > 0 ? (
                filteredDebts.map((debt, index) => {
                  const customer = customers[debt.customerId];
                  const isOverdue = new Date(debt.deadline) < new Date() && debt.debt > 0;
                  
                  return (
                    <tr key={debt.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer ? customer.name : 'Неизвестный клиент'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.total.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {debt.paid.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          debt.debt > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {debt.debt.toFixed(2)} сом
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {debt.deadline}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {debt.debt > 0 && (
                          <button
                            onClick={() => handlePayDebt(debt.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Оплатить
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о задолженностях клиентов
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

export default ClientDebts;