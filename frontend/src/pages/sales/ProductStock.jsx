import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ProductStock = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState({});
  const [warehouses, setWarehouses] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

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
    if (user.role !== 'Sales Manager' && user.role !== 'Admin' && user.role !== 'Supplies Manager') {
      navigate('/mainpage');
      return;
    }
    
    // Загрузка данных
    loadInitialData();
  }, [navigate]);

  const loadInitialData = () => {
    setLoading(true);
    
    // Загрузка товаров
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Получаем уникальные категории
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    setCategories(uniqueCategories);
    
    // Загрузка поставщиков
    const suppliersData = JSON.parse(localStorage.getItem('suppliers') || '[]');
    const suppliersMap = {};
    suppliersData.forEach(supplier => {
      suppliersMap[supplier.id] = supplier;
    });
    setSuppliers(suppliersMap);
    
    // Загрузка складов
    const warehousesData = JSON.parse(localStorage.getItem('warehouses') || '[]');
    const warehousesMap = {};
    warehousesData.forEach(warehouse => {
      warehousesMap[warehouse.id] = warehouse;
    });
    setWarehouses(warehousesMap);
    
    // Загрузка данных о наличии товаров
    loadStockData();
  };

  const loadStockData = () => {
    // Получаем данные о товарах на складе
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const warehouseStock = JSON.parse(localStorage.getItem('warehouseStock') || '[]');
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    
    // Если нет данных о товарах на складе, но есть товары и склады
    if (warehouseStock.length === 0 && products.length > 0 && Object.keys(warehouses).length > 0) {
      createDemoStockData();
      return;
    }
    
    // Группируем товары по складам и ID товара
    const stockByProductAndWarehouse = {};
    
    warehouseStock.forEach(item => {
      const key = `${item.productId}_${item.warehouseId}`;
      if (!stockByProductAndWarehouse[key]) {
        stockByProductAndWarehouse[key] = {
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: 0,
          price: item.price,
          supplies: new Set()
        };
      }
      
      stockByProductAndWarehouse[key].quantity += Number(item.quantity);
      stockByProductAndWarehouse[key].supplies.add(item.supplyId);
    });
    
    // Преобразуем в массив с дополнительной информацией
    const stockData = Object.values(stockByProductAndWarehouse).map(item => {
      const product = products.find(p => p.id === item.productId);
      
      // Находим поставщика для последней поставки
      let supplierId = null;
      if (item.supplies.size > 0) {
        const supplyId = Array.from(item.supplies)[item.supplies.size - 1];
        const supply = supplies.find(s => s.id === supplyId);
        if (supply) {
          supplierId = supply.supplierId;
        }
      }
      
      return {
        productId: item.productId,
        warehouseId: item.warehouseId,
        productName: product ? product.name : 'Неизвестный товар',
        category: product ? product.category : 'Неизвестная категория',
        quantity: item.quantity,
        price: item.price,
        supplierId: supplierId,
        totalValue: item.quantity * item.price
      };
    });
    
    setStockData(stockData);
    setLoading(false);
  };

  const createDemoStockData = () => {
    // Получаем товары и склады
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const warehousesData = Object.values(warehouses);
    
    if (products.length === 0 || warehousesData.length === 0) {
      setLoading(false);
      return;
    }
    
    // Создаем демо-данные о поставщиках если их нет
    let suppliersData = JSON.parse(localStorage.getItem('suppliers') || '[]');
    if (suppliersData.length === 0) {
      suppliersData = [
        { id: '1', name: 'ООО "ПоставкаПлюс"', contact: '+123456789', address: 'ул. Поставщиков, 1' },
        { id: '2', name: 'ИП Иванов', contact: '+987654321', address: 'ул. Складская, 5' },
        { id: '3', name: 'Глобал Трейд', contact: '+555666777', address: 'пр. Логистический, 10' }
      ];
      localStorage.setItem('suppliers', JSON.stringify(suppliersData));
      
      const suppliersMap = {};
      suppliersData.forEach(supplier => {
        suppliersMap[supplier.id] = supplier;
      });
      setSuppliers(suppliersMap);
    }
    
    // Создаем демо-поставки
    const demoSupplies = [];
    const demoStockItems = [];
    
    // Поставка 1: для первого склада
    const supply1Id = '1' + Date.now().toString();
    const supply1 = {
      id: supply1Id,
      supplierId: suppliersData[0].id,
      warehouseId: warehousesData[0].id,
      date: new Date().toISOString().split('T')[0],
      paymentType: 'transfer',
      isPaid: true,
      total: 0,
      items: [],
      employeeId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    
    // Добавляем первые 5 товаров на склад
    const warehouseItems1 = [];
    let supply1Total = 0;
    
    products.slice(0, 5).forEach(product => {
      const quantity = Math.floor(Math.random() * 10) + 5; // От 5 до 15 штук
      const price = product.purchasePrice;
      const itemTotal = quantity * price;
      supply1Total += itemTotal;
      
      supply1.items.push({
        productId: product.id,
        quantity: quantity,
        price: price,
        total: itemTotal
      });
      
      warehouseItems1.push({
        id: Date.now() + Math.random().toString().substring(2, 8),
        warehouseId: warehousesData[0].id,
        productId: product.id,
        quantity: quantity,
        supplyId: supply1Id,
        price: price,
        date: new Date().toISOString()
      });
    });
    
    supply1.total = supply1Total;
    demoSupplies.push(supply1);
    demoStockItems.push(...warehouseItems1);
    
    // Поставка 2: для второго склада
    if (warehousesData.length > 1) {
      const supply2Id = '2' + Date.now().toString();
      const supply2 = {
        id: supply2Id,
        supplierId: suppliersData[1].id,
        warehouseId: warehousesData[1].id,
        date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 дней назад
        paymentType: 'cash',
        isPaid: true,
        total: 0,
        items: [],
        employeeId: currentUser.id,
        createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Добавляем следующие 5 товаров на склад
      const warehouseItems2 = [];
      let supply2Total = 0;
      
      products.slice(2, 7).forEach(product => {
        const quantity = Math.floor(Math.random() * 10) + 3; // От 3 до 13 штук
        const price = product.purchasePrice;
        const itemTotal = quantity * price;
        supply2Total += itemTotal;
        
        supply2.items.push({
          productId: product.id,
          quantity: quantity,
          price: price,
          total: itemTotal
        });
        
        warehouseItems2.push({
          id: Date.now() + Math.random().toString().substring(2, 8),
          warehouseId: warehousesData[1].id,
          productId: product.id,
          quantity: quantity,
          supplyId: supply2Id,
          price: price,
          date: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      });
      
      supply2.total = supply2Total;
      demoSupplies.push(supply2);
      demoStockItems.push(...warehouseItems2);
    }
    
    // Сохраняем данные в localStorage
    const existingSupplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    localStorage.setItem('supplies', JSON.stringify([...existingSupplies, ...demoSupplies]));
    
    const existingStock = JSON.parse(localStorage.getItem('warehouseStock') || '[]');
    localStorage.setItem('warehouseStock', JSON.stringify([...existingStock, ...demoStockItems]));
    
    // Создаем платежи для поставок
    const demoPayments = demoSupplies.map(supply => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      supplyId: supply.id,
      amount: supply.total,
      date: supply.date,
      paymentType: supply.paymentType,
      employeeId: currentUser.id
    }));
    
    const existingPayments = JSON.parse(localStorage.getItem('supplyPayments') || '[]');
    localStorage.setItem('supplyPayments', JSON.stringify([...existingPayments, ...demoPayments]));
    
    // Загружаем данные о товарах на складе
    loadStockData();
  };

  // Фильтрация и сортировка данных
  const filteredAndSortedStock = [...stockData]
    // Фильтрация по категории
    .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
    // Фильтрация по складу
    .filter(item => selectedWarehouse === 'all' || item.warehouseId === selectedWarehouse)
    // Фильтрация по поиску
    .filter(item => {
      const searchLower = searchQuery.toLowerCase();
      return item.productName.toLowerCase().includes(searchLower) || 
             item.category.toLowerCase().includes(searchLower);
    })
    // Сортировка
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' 
          ? a.productName.localeCompare(b.productName)
          : b.productName.localeCompare(a.productName);
      } else if (sortField === 'quantity') {
        return sortDirection === 'asc' 
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      } else if (sortField === 'price') {
        return sortDirection === 'asc' 
          ? a.price - b.price
          : b.price - a.price;
      }
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
          <h1 className="text-2xl font-bold text-gray-900">Остатки по товарам</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Категория товаров
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все категории</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-1">
                Склад
              </label>
              <select
                id="warehouse"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все склады</option>
                {Object.values(warehouses).map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.location})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите название товара"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Всего товаров на складах</p>
              <p className="text-xl font-bold">{stockData.reduce((sum, item) => sum + item.quantity, 0)} шт.</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Общая стоимость товаров</p>
              <p className="text-xl font-bold">
                {stockData.reduce((sum, item) => sum + (item.quantity * item.price), 0).toFixed(2)} сом
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Количество позиций</p>
              <p className="text-xl font-bold">{filteredAndSortedStock.length}</p>
            </div>
          </div>
        </div>

        {/* Таблица с остатками */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Поставщик
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Товар
                    {sortField === 'name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип товара
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Цена
                    {sortField === 'price' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Кол-во
                    {sortField === 'quantity' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Склад
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedStock.length > 0 ? (
                filteredAndSortedStock.map((item, index) => {
                  const supplier = item.supplierId ? suppliers[item.supplierId] : null;
                  const warehouse = warehouses[item.warehouseId];
                  
                  return (
                    <tr key={`${item.productId}_${item.warehouseId}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {supplier ? supplier.name : 'Неизвестный поставщик'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.price.toFixed(2)} сом
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.quantity} шт.
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {warehouse ? warehouse.name : 'Неизвестный склад'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Нет данных о товарах на складе
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

export default ProductStock;