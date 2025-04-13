import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SupplierDebts = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [debts, setDebts] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all, debt, paid

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
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка поставщиков
    const suppliersData = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const suppliersMap = {};
    suppliersData.forEach(supplier => {
      suppliersMap[supplier.id] = supplier;
    });
    setSuppliers(suppliersMap);
    
    // Загрузка сотрудников
    const employeesData = JSON.parse(localStorage.getItem('employees') || '[]');
    if (employeesData.length === 0) {
      // Демо данные если нет сотрудников
      const demoEmployees = [
        { id: '1', name: 'Иванов Иван', position: 'Менеджер по поставкам' },
        { id: '2', name: 'Петров Петр', position: 'Бухгалтер' },
        { id: '3', name: 'Сидорова Анна', position: 'Администратор' }
      ];
      localStorage.setItem('employees', JSON.stringify(demoEmployees));
      
      const employeesMap = {};
      demoEmployees.forEach(employee => {
        employeesMap[employee.id] = employee;
      });
      setEmployees(employeesMap);
    } else {
      const employeesMap = {};
      employeesData.forEach(employee => {
        employeesMap[employee.id] = employee;
      });
      setEmployees(employeesMap);
    }
    
    // Загрузка поставок и платежей
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    const payments = JSON.parse(localStorage.getItem('supplyPayments') || '[]');
    
    // Вычисляем задолженности
    const debtsList = supplies.map(supply => {
      // Находим все платежи по данной поставке
      const supplyPayments = payments.filter(payment => payment.supplyId === supply.id);
      const paidAmount = supplyPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remainingDebt = Number(supply.total) - paidAmount;
      
      // Дата дедлайна (для примера: +30 дней от даты поставки)
      const supplyDate = new Date(supply.date);
      const deadlineDate = new Date(supplyDate);
      deadlineDate.setDate(deadlineDate.getDate() + 30);
      
      return {
        id: supply.id,
        supplierId: supply.supplierId,
        employeeId: supply.employeeId,
        invoiceNumber: `INV-${supply.id.substring(supply.id.length - 6)}`,
        date: supply.date,
        total: Number(supply.total),
        paid: paidAmount,
        debt: remainingDebt,
        deadline: deadlineDate.toISOString().split('T')[0],
        status: remainingDebt > 0 ? 'debt' : 'paid'
      };
    });
    
    setDebts(debtsList);
    setLoading(false);
  };

  // Фильтрация данных по статусу
  const filteredDebts = filterStatus === 'all' 
    ? debts 
    : debts.filter(debt => debt.status === filterStatus);

  // Обработчик оплаты поставки
  const handlePayDebt = (debtId) => {
    navigate(`/supplies/pay-supply/${debtId}`);
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
          <h1 className="text-2xl font-bold text-gray-900">Задолженность по поставкам</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === 'all' 
                  ? 'bg-blue-800 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Все поставки
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
        </div>

        {/* Таблица с задолженностями */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Поставка
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер накладной
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма поставки
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Оплачено
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Задолженность
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дедлайн
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDebts.length > 0 ? (
                filteredDebts.map((debt, index) => (
                  <tr key={debt.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {suppliers[debt.supplierId]?.name || 'Неизвестный поставщик'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employees[debt.employeeId]?.name || 'Неизвестный сотрудник'}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {debt.deadline}
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
                      <Link
                        to={`/supplies/edit-supply/${debt.id}`}
                        className="ml-3 text-indigo-600 hover:text-indigo-900"
                      >
                        Изменить
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о задолженностях по поставкам
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

export default SupplierDebts;