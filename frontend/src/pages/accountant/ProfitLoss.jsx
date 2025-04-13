import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ProfitLoss = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    income: [],
    expenses: [],
    taxes: [],
    totalIncome: 0,
    totalExpenses: 0,
    totalTaxes: 0,
    netProfit: 0
  });
  const [dateRange, setDateRange] = useState({
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
    
    // Проверка роли (только Accountant и Admin могут видеть этот отчет)
    if (user.role !== 'Accountant' && user.role !== 'Admin') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadReportData();
  }, [navigate, dateRange]);

  const loadReportData = () => {
    setLoading(true);
    
    // Получаем все данные из localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderItems = JSON.parse(localStorage.getItem('orderItems') || '[]');
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    const employees = JSON.parse(localStorage.getItem('employees') || '[]');
    const salaries = JSON.parse(localStorage.getItem('employeeSalaries') || '[]');
    const taxes = JSON.parse(localStorage.getItem('taxes') || '[]');
    
    // Если нет данных о налогах, добавляем демо-данные
    if (taxes.length === 0) {
      const demoTaxes = [
        { id: '1', name: 'НДС', rate: 0.12, startDate: '2023-01-01', endDate: '2025-12-31' },
        { id: '2', name: 'Налог на прибыль', rate: 0.10, startDate: '2023-01-01', endDate: '2025-12-31' },
        { id: '3', name: 'Социальные отчисления', rate: 0.17, startDate: '2023-01-01', endDate: '2025-12-31' }
      ];
      localStorage.setItem('taxes', JSON.stringify(demoTaxes));
    }
    
    // Фильтруем по дате
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Устанавливаем конец дня
    
    // Фильтруем заказы по дате
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });
    
    // Фильтруем поставки по дате
    const filteredSupplies = supplies.filter(supply => {
      const supplyDate = new Date(supply.date);
      return supplyDate >= startDate && supplyDate <= endDate;
    });
    
    // Фильтруем зарплаты по дате
    const filteredSalaries = salaries.filter(salary => {
      const salaryDate = new Date(salary.date);
      return salaryDate >= startDate && salaryDate <= endDate;
    });
    
    // Расчет доходов (по категориям товаров)
    const incomeByCategory = {};
    
    filteredOrders.forEach(order => {
      // Получаем все товары в заказе
      const items = orderItems.filter(item => item.orderId === order.id);
      
      items.forEach(item => {
        const productData = JSON.parse(localStorage.getItem('products') || '[]')
          .find(p => p.id === item.productId);
        
        if (productData) {
          const category = productData.category;
          if (!incomeByCategory[category]) {
            incomeByCategory[category] = 0;
          }
          
          incomeByCategory[category] += Number(item.price) * Number(item.quantity);
        }
      });
    });
    
    // Преобразуем в массив для отображения
    const incomeData = Object.entries(incomeByCategory).map(([category, amount], index) => ({
      id: index + 1,
      name: `Продажи товаров категории "${category}"`,
      amount: amount
    }));
    
    // Расчет расходов
    const expenses = [];
    
    // Расходы на поставки
    let totalSupplyCost = 0;
    filteredSupplies.forEach(supply => {
      const supplyCost = supply.items.reduce((sum, item) => 
        sum + (Number(item.price) * Number(item.quantity)), 0);
      totalSupplyCost += supplyCost;
    });
    
    if (totalSupplyCost > 0) {
      expenses.push({
        id: 1,
        name: 'Закупка товаров',
        amount: totalSupplyCost
      });
    }
    
    // Расходы на зарплаты
    let totalSalaries = 0;
    filteredSalaries.forEach(salary => {
      totalSalaries += Number(salary.amount);
    });
    
    if (totalSalaries > 0) {
      expenses.push({
        id: 2,
        name: 'Заработная плата сотрудников',
        amount: totalSalaries
      });
    }
    
    // Добавляем фиксированные расходы (аренда, коммунальные услуги и т.д.)
    // Это примерные данные для демонстрации
    expenses.push({
      id: 3,
      name: 'Аренда помещений',
      amount: 25000
    });
    
    expenses.push({
      id: 4,
      name: 'Коммунальные услуги',
      amount: 15000
    });
    
    expenses.push({
      id: 5,
      name: 'Маркетинг и реклама',
      amount: 10000
    });
    
    // Расчет налогов
    // Получаем актуальные налоги
    const activeTaxes = JSON.parse(localStorage.getItem('taxes') || '[]')
      .filter(tax => new Date(tax.startDate) <= endDate && new Date(tax.endDate) >= startDate);
    
    // Расчет общего дохода
    const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
    
    // Расчет общих расходов
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    
    // Расчет прибыли до налогообложения
    const profitBeforeTax = totalIncome - totalExpenses;
    
    // Расчет налогов
    const taxesData = [];
    let totalTaxAmount = 0;
    
    activeTaxes.forEach((tax, index) => {
      let taxableAmount = profitBeforeTax;
      let taxAmount = 0;
      
      // Разные налоги могут иметь разную базу, для примера:
      if (tax.name === 'НДС') {
        taxableAmount = totalIncome;
        taxAmount = taxableAmount * tax.rate;
      } else if (tax.name === 'Налог на прибыль') {
        taxableAmount = profitBeforeTax > 0 ? profitBeforeTax : 0;
        taxAmount = taxableAmount * tax.rate;
      } else if (tax.name === 'Социальные отчисления') {
        taxableAmount = totalSalaries;
        taxAmount = taxableAmount * tax.rate;
      }
      
      if (taxAmount > 0) {
        taxesData.push({
          id: index + 1,
          name: tax.name,
          rate: tax.rate,
          base: taxableAmount,
          amount: taxAmount
        });
        
        totalTaxAmount += taxAmount;
      }
    });
    
    // Расчет чистой прибыли
    const netProfit = profitBeforeTax - totalTaxAmount;
    
    // Устанавливаем данные отчета
    setReportData({
      income: incomeData,
      expenses: expenses,
      taxes: taxesData,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      totalTaxes: totalTaxAmount,
      netProfit: netProfit
    });
    
    setLoading(false);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
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
          <h1 className="text-2xl font-bold text-gray-900">Отчет о прибылях и убытках</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры по датам */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
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
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadReportData}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Применить фильтр
              </button>
            </div>
          </div>
        </div>

        {/* Информационная панель с итогами */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Общий доход</p>
              <p className="text-xl font-bold">{reportData.totalIncome.toFixed(2)} сом</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Общие расходы</p>
              <p className="text-xl font-bold">{reportData.totalExpenses.toFixed(2)} сом</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Налоги</p>
              <p className="text-xl font-bold">{reportData.totalTaxes.toFixed(2)} сом</p>
            </div>
            <div className={`p-3 rounded-lg ${reportData.netProfit >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
              <p className="text-sm text-gray-500">Чистая прибыль</p>
              <p className={`text-xl font-bold ${reportData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {reportData.netProfit.toFixed(2)} сом
              </p>
            </div>
          </div>
        </div>

        {/* Таблица с доходами */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-green-50 px-6 py-3">
            <h2 className="text-lg font-medium text-gray-900">Доходы</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Источник дохода
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.income.length > 0 ? (
                reportData.income.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {item.amount.toFixed(2)} сом
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о доходах за выбранный период
                  </td>
                </tr>
              )}
              <tr className="bg-green-50">
                <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ИТОГО ДОХОДЫ:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {reportData.totalIncome.toFixed(2)} сом
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Таблица с расходами */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-red-50 px-6 py-3">
            <h2 className="text-lg font-medium text-gray-900">Расходы</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория расходов
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.expenses.length > 0 ? (
                reportData.expenses.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {item.amount.toFixed(2)} сом
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о расходах за выбранный период
                  </td>
                </tr>
              )}
              <tr className="bg-red-50">
                <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ИТОГО РАСХОДЫ:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  {reportData.totalExpenses.toFixed(2)} сом
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Таблица с налогами */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-yellow-50 px-6 py-3">
            <h2 className="text-lg font-medium text-gray-900">Налоги</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Вид налога
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ставка
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Налоговая база
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.taxes.length > 0 ? (
                reportData.taxes.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item.rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.base.toFixed(2)} сом
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                      {item.amount.toFixed(2)} сом
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о налогах за выбранный период
                  </td>
                </tr>
              )}
              <tr className="bg-yellow-50">
                <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ИТОГО НАЛОГИ:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-600">
                  {reportData.totalTaxes.toFixed(2)} сом
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Итоговая прибыль */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody>
              <tr className="bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold">
                  Доходы
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-green-600">
                  {reportData.totalIncome.toFixed(2)} сом
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold">
                  Расходы
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-red-600">
                  {reportData.totalExpenses.toFixed(2)} сом
                </td>
              </tr>
              <tr className="bg-gray-100">
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold">
                  Налоги
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-yellow-600">
                  {reportData.totalTaxes.toFixed(2)} сом
                </td>
              </tr>
              <tr className="bg-blue-50">
                <td className="px-6 py-6 whitespace-nowrap text-xl font-bold">
                  ЧИСТАЯ ПРИБЫЛЬ
                </td>
                <td className={`px-6 py-6 whitespace-nowrap text-xl font-bold ${reportData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {reportData.netProfit.toFixed(2)} сом
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;