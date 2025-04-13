import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const EmployeeSalary = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 500,
    workDays: 0.5,
    comment: 'Частичная оплата за день'
  });
  const [errors, setErrors] = useState('');
  const [filter, setFilter] = useState({
    employeeId: 'all',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

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
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка сотрудников
    const employeesData = JSON.parse(localStorage.getItem('employees') || '[]');
    if (employeesData.length === 0) {
      // Демо данные если нет сотрудников
      const demoEmployees = [
        { id: '1', name: 'Иванов Иван', position: 'Менеджер по поставкам', dailyRate: 1000 },
        { id: '2', name: 'Петров Петр', position: 'Бухгалтер', dailyRate: 1200 },
        { id: '3', name: 'Сидорова Анна', position: 'Администратор', dailyRate: 1100 },
        { id: '4', name: 'Козлов Андрей', position: 'Менеджер по продажам', dailyRate: 1000 },
        { id: '5', name: 'Морозова Елена', position: 'Кладовщик', dailyRate: 800 }
      ];
      localStorage.setItem('employees', JSON.stringify(demoEmployees));
      setEmployees(demoEmployees);
    } else {
      setEmployees(employeesData);
    }
    
    // Загрузка истории зарплат
    const salaryData = JSON.parse(localStorage.getItem('employeeSalaries') || '[]');
    setSalaryHistory(salaryData);
    
    setLoading(false);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'employeeId') {
      const selectedEmployee = employees.find(emp => emp.id === value);
      if (selectedEmployee) {
        // Автоматически рассчитываем сумму на основе дневной ставки
        const amount = selectedEmployee.dailyRate * paymentForm.workDays;
        setPaymentForm(prev => ({ 
          ...prev, 
          [name]: value,
          amount: amount
        }));
      } else {
        setPaymentForm(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'workDays') {
      const workDays = parseFloat(value);
      if (!isNaN(workDays) && workDays > 0) {
        const selectedEmployee = employees.find(emp => emp.id === paymentForm.employeeId);
        if (selectedEmployee) {
          // Автоматически рассчитываем сумму на основе дневной ставки
          const amount = selectedEmployee.dailyRate * workDays;
          setPaymentForm(prev => ({ 
            ...prev, 
            [name]: workDays,
            amount: amount
          }));
        } else {
          setPaymentForm(prev => ({ ...prev, [name]: workDays }));
        }
      } else {
        setPaymentForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setPaymentForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handlePaySalary = (e) => {
    e.preventDefault();
    
    // Валидация
    if (!paymentForm.employeeId) {
      setErrors('Выберите сотрудника');
      return;
    }
    
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      setErrors('Введите корректную сумму');
      return;
    }
    
    // Создаем новую запись о зарплате
    const newSalary = {
      id: Date.now().toString(),
      employeeId: paymentForm.employeeId,
      date: paymentForm.date,
      amount: Number(paymentForm.amount),
      workDays: Number(paymentForm.workDays),
      comment: paymentForm.comment || '',
      paidBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    
    // Добавляем в историю и сохраняем в localStorage
    const updatedHistory = [...salaryHistory, newSalary];
    setSalaryHistory(updatedHistory);
    localStorage.setItem('employeeSalaries', JSON.stringify(updatedHistory));
    
    // Сброс формы
    setPaymentForm({
      employeeId: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      workDays: 0.5,
      comment: ''
    });
    
    setErrors('');
    
    // Показываем уведомление
    alert('Зарплата успешно выплачена!');
  };

  const applyFilter = () => {
    // Фильтрация осуществляется при отображении, не нужно обновлять состояние
    // Просто заставляем компонент перерисоваться
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  // Фильтрация истории зарплат
  const filteredHistory = salaryHistory.filter(salary => {
    const salaryDate = new Date(salary.date);
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
    
    return (
      (filter.employeeId === 'all' || salary.employeeId === filter.employeeId) &&
      salaryDate >= startDate && 
      salaryDate <= endDate
    );
  });

  // Общая сумма выплат после фильтрации
  const totalPaid = filteredHistory.reduce((sum, salary) => sum + Number(salary.amount), 0);

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
          <h1 className="text-2xl font-bold text-gray-900">Зарплата сотрудников</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Форма выплаты зарплаты */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Выплата зарплаты</h2>
            
            {errors && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {errors}
              </div>
            )}
            
            <form onSubmit={handlePaySalary}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                    Сотрудник
                  </label>
                  <select
                    id="employeeId"
                    name="employeeId"
                    value={paymentForm.employeeId}
                    onChange={handlePaymentFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Выберите сотрудника</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Дата выплаты
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={paymentForm.date}
                    onChange={handlePaymentFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="workDays" className="block text-sm font-medium text-gray-700 mb-1">
                    Рабочих дней
                  </label>
                  <input
                    type="number"
                    id="workDays"
                    name="workDays"
                    value={paymentForm.workDays}
                    onChange={handlePaymentFormChange}
                    required
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Сумма (сом)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentFormChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                    Комментарий
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={paymentForm.comment}
                    onChange={handlePaymentFormChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Выплатить зарплату
                  </button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Фильтры для истории */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4">Фильтр истории выплат</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="filter-employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Сотрудник
                </label>
                <select
                  id="filter-employeeId"
                  name="employeeId"
                  value={filter.employeeId}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Все сотрудники</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="filter-startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    С даты
                  </label>
                  <input
                    type="date"
                    id="filter-startDate"
                    name="startDate"
                    value={filter.startDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="filter-endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    По дату
                  </label>
                  <input
                    type="date"
                    id="filter-endDate"
                    name="endDate"
                    value={filter.endDate}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <button
                  onClick={applyFilter}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Применить фильтр
                </button>
              </div>
              
              {/* Итоги по фильтру */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">Всего выплачено:</span>
                  <span className="font-bold">{totalPaid.toFixed(2)} сом</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-medium">Количество выплат:</span>
                  <span className="font-bold">{filteredHistory.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* История выплат */}
        <div className="mt-8 bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">История выплат зарплат</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Номер
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сотрудник
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Должность
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дней
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Начислено
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Комментарий
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((salary, index) => {
                    const employee = employees.find(emp => emp.id === salary.employeeId);
                    
                    return (
                      <tr key={salary.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee ? employee.name : 'Неизвестный сотрудник'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee ? employee.position : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.workDays || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {Number(salary.amount).toFixed(2)} сом
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {salary.comment || '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      Нет данных о выплатах зарплат за выбранный период
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ИТОГО:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {totalPaid.toFixed(2)} сом
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSalary;