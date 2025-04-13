import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PaySupply = () => {
  const { supplyId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [supply, setSupply] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentType: 'cash',
    date: new Date().toISOString().split('T')[0],
    comment: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payments, setPayments] = useState([]);
  const [remainingDebt, setRemainingDebt] = useState(0);

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
    
    // Загрузка данных о поставке
    loadSupplyData();
  }, [navigate, supplyId]);

  const loadSupplyData = () => {
    setLoading(true);
    
    // Загрузка поставки по ID
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    const foundSupply = supplies.find(s => s.id === supplyId);
    
    if (!foundSupply) {
      setError('Поставка не найдена');
      setLoading(false);
      return;
    }
    
    setSupply(foundSupply);
    
    // Загрузка поставщика
    const suppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const foundSupplier = suppliers.find(s => s.id === foundSupply.supplierId);
    setSupplier(foundSupplier);
    
    // Загрузка предыдущих платежей по этой поставке
    const allPayments = JSON.parse(localStorage.getItem('supplyPayments') || '[]');
    const supplyPayments = allPayments.filter(payment => payment.supplyId === supplyId);
    setPayments(supplyPayments);
    
    // Вычисление оставшейся задолженности
    const totalPaid = supplyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const debt = Number(foundSupply.total) - totalPaid;
    setRemainingDebt(debt);
    
    // Устанавливаем сумму по умолчанию на всю задолженность
    setPaymentData(prev => ({ ...prev, amount: debt }));
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверка на валидность суммы
    const amount = Number(paymentData.amount);
    if (amount <= 0) {
      setError('Сумма оплаты должна быть больше нуля');
      return;
    }
    
    if (amount > remainingDebt) {
      setError('Сумма оплаты не может превышать оставшуюся задолженность');
      return;
    }
    
    // Сохранение платежа
    const newPayment = {
      id: Date.now().toString(),
      supplyId: supplyId,
      amount: amount,
      paymentType: paymentData.paymentType,
      date: paymentData.date,
      comment: paymentData.comment,
      employeeId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    
    const allPayments = JSON.parse(localStorage.getItem('supplyPayments') || '[]');
    localStorage.setItem('supplyPayments', JSON.stringify([...allPayments, newPayment]));
    
    // Обновляем поставку, если она полностью оплачена
    if (amount === remainingDebt) {
      const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
      const updatedSupplies = supplies.map(s => {
        if (s.id === supplyId) {
          return { ...s, isPaid: true };
        }
        return s;
      });
      localStorage.setItem('supplies', JSON.stringify(updatedSupplies));
    }
    
    // Перенаправление на страницу с задолженностями
    navigate('/supplies/supplier-debts');
    
    // Показываем уведомление об успехе
    alert('Оплата успешно произведена!');
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

  // Если есть ошибка
  if (error && !supply) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-600 text-xl font-medium mb-4">{error}</div>
          <button
            onClick={() => navigate('/supplies/supplier-debts')}
            className="w-full bg-blue-800 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к списку задолженностей
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Оплата поставки</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Информация о поставке</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Поставщик</p>
                <p className="font-medium">{supplier?.name || 'Неизвестный поставщик'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Номер накладной</p>
                <p className="font-medium">INV-{supply?.id.substring(supply?.id.length - 6)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Дата поставки</p>
                <p className="font-medium">{supply?.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Общая сумма</p>
                <p className="font-medium">{Number(supply?.total).toFixed(2)} сом</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Уже оплачено</p>
                <p className="font-medium">
                  {(Number(supply?.total) - remainingDebt).toFixed(2)} сом
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Осталось оплатить</p>
                <p className="font-medium text-red-600">{remainingDebt.toFixed(2)} сом</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Сумма оплаты
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  min="0.01"
                  step="0.01"
                  max={remainingDebt}
                  value={paymentData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип оплаты
                </label>
                <select
                  id="paymentType"
                  name="paymentType"
                  required
                  value={paymentData.paymentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Наличные</option>
                  <option value="card">Банковская карта</option>
                  <option value="transfer">Банковский перевод</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Дата оплаты
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={paymentData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий (необязательно)
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows="3"
                  value={paymentData.comment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
            
            {/* История платежей */}
            {payments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-3">История платежей</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Тип оплаты
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment, index) => (
                        <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Number(payment.amount).toFixed(2)} сом
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentType === 'cash' && 'Наличные'}
                            {payment.paymentType === 'card' && 'Банковская карта'}
                            {payment.paymentType === 'transfer' && 'Банковский перевод'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Кнопки действий */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/supplies/supplier-debts')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Отмена
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Произвести оплату
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaySupply;