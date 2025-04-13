import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterEmployee = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Sales Manager',
    name: '',
    position: '',
    phone: '',
    email: '',
    dailyRate: 1000
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли (только Admin может регистрировать сотрудников)
    if (user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadEmployees();
    
    // Записываем посещение страницы
    recordFormVisit('/admin/register-employee', user.id);
  }, [navigate]);

  const loadEmployees = () => {
    setLoading(true);
    
    // Получаем список сотрудников
    const employeesData = JSON.parse(localStorage.getItem('employees') || '[]');
    setEmployees(employeesData);
    
    setLoading(false);
  };

  const recordFormVisit = (formPath, userId) => {
    // Получаем текущего пользователя
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(u => u.id === userId);
    
    if (!currentUser) return;
    
    // Получаем текущие записи о посещениях
    const formVisits = JSON.parse(localStorage.getItem('formVisits') || '[]');
    
    // Добавляем новую запись
    const newVisit = {
      id: Date.now(),
      formPath,
      userId,
      userName: currentUser.username,
      timestamp: new Date().toISOString()
    };
    
    formVisits.push(newVisit);
    
    // Сохраняем обновленные данные
    localStorage.setItem('formVisits', JSON.stringify(formVisits));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Для поля dailyRate преобразуем в число
    if (name === 'dailyRate') {
      const rate = Number(value);
      if (!isNaN(rate) && rate >= 0) {
        setFormData(prev => ({ ...prev, [name]: rate }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Валидация
    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }
    
    // Проверка уникальности логина
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(user => user.username === formData.username)) {
      setError('Пользователь с таким логином уже существует');
      return;
    }
    
    // Создаем нового пользователя
    const newUserId = Date.now().toString();
    const newUser = {
      id: newUserId,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      createdAt: new Date().toISOString()
    };
    
    // Создаем нового сотрудника
    const newEmployee = {
      id: newUserId,
      name: formData.name,
      position: formData.position || formData.role,
      phone: formData.phone,
      email: formData.email,
      dailyRate: formData.dailyRate,
      createdAt: new Date().toISOString()
    };
    
    // Сохраняем данные
    localStorage.setItem('users', JSON.stringify([...users, newUser]));
    localStorage.setItem('employees', JSON.stringify([...employees, newEmployee]));
    
    // Обновляем список сотрудников
    setEmployees(prev => [...prev, newEmployee]);
    
    // Сбрасываем форму
    setFormData({
      username: '',
      password: '',
      role: 'Sales Manager',
      name: '',
      position: '',
      phone: '',
      email: '',
      dailyRate: 1000
    });
    
    // Показываем сообщение об успехе
    setSuccess('Сотрудник успешно зарегистрирован!');
    setError('');
    
    // Скрываем сообщение через 3 секунды
    setTimeout(() => {
      setSuccess('');
    }, 3000);
  };

  const generatePassword = () => {
    // Генерация случайного пароля
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setFormData(prev => ({ ...prev, password }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const deleteEmployee = (employeeId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      // Удаляем сотрудника
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      setEmployees(updatedEmployees);
      localStorage.setItem('employees', JSON.stringify(updatedEmployees));
      
      // Удаляем пользователя
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.filter(user => user.id !== employeeId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // Показываем сообщение
      setSuccess('Сотрудник успешно удален!');
      
      // Скрываем сообщение через 3 секунды
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Регистрация сотрудников</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Форма регистрации */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Регистрация нового сотрудника</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Логин *
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Пароль *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-10 flex items-center px-2 text-gray-700"
                    >
                      {showPassword ? "Скрыть" : "Показать"}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="absolute inset-y-0 right-0 flex items-center px-2 text-blue-600"
                    >
                      Генерировать
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Роль *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Sales Manager">Менеджер по продажам</option>
                    <option value="Supplies Manager">Менеджер по поставкам</option>
                    <option value="Accountant">Бухгалтер</option>
                    <option value="Admin">Администратор</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    ФИО сотрудника *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Должность
                  </label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Оставьте пустым для использования роли"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="dailyRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Дневная ставка (сом)
                  </label>
                  <input
                    type="number"
                    id="dailyRate"
                    name="dailyRate"
                    value={formData.dailyRate}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Зарегистрировать сотрудника
                </button>
              </div>
            </form>
          </div>

          {/* Список сотрудников */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Список сотрудников</h2>
            </div>
            
            <div className="overflow-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ФИО
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Должность
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ставка
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.length > 0 ? (
                    employees.map((employee, index) => (
                      <tr key={employee.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.dailyRate} сом/день
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        Нет зарегистрированных сотрудников
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEmployee;