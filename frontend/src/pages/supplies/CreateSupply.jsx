import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSupply = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplyItems, setSupplyItems] = useState([{ productId: '', quantity: 1, price: 0 }]);
  const [supplyData, setSupplyData] = useState({
    supplierId: '',
    warehouseId: '',
    date: new Date().toISOString().split('T')[0],
    paymentType: 'cash',
    isPaid: false,
    total: 0
  });

  // Загрузка данных пользователя и проверка доступа
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Проверка роли (только Supplies Manager и Admin могут создавать поставки)
    if (user.role !== 'Supplies Manager' && user.role !== 'Admin') {
      navigate('/mainpage');
    }
    
    // Загрузка данных из localStorage
    loadInitialData();
  }, [navigate]);

  // Загрузка начальных данных из localStorage
  const loadInitialData = () => {
    // Загрузка поставщиков
    const storedSuppliers = JSON.parse(localStorage.getItem('suppliers') || '[]');
    if (storedSuppliers.length === 0) {
      // Добавляем демо-поставщиков, если их нет
      const demoSuppliers = [
        { id: '1', name: 'ООО "ПоставкаПлюс"', contact: '+123456789', address: 'ул. Поставщиков, 1' },
        { id: '2', name: 'ИП Иванов', contact: '+987654321', address: 'ул. Складская, 5' },
        { id: '3', name: 'Глобал Трейд', contact: '+555666777', address: 'пр. Логистический, 10' }
      ];
      localStorage.setItem('suppliers', JSON.stringify(demoSuppliers));
      setSuppliers(demoSuppliers);
    } else {
      setSuppliers(storedSuppliers);
    }

    // Загрузка складов
    const storedWarehouses = JSON.parse(localStorage.getItem('warehouses') || '[]');
    if (storedWarehouses.length === 0) {
      // Добавляем демо-склады, если их нет
      const demoWarehouses = [
        { id: '1', name: 'Основной склад', location: 'г. Москва', phone: '+111222333' },
        { id: '2', name: 'Региональный склад', location: 'г. Санкт-Петербург', phone: '+444555666' },
        { id: '3', name: 'Филиал №3', location: 'г. Новосибирск', phone: '+777888999' }
      ];
      localStorage.setItem('warehouses', JSON.stringify(demoWarehouses));
      setWarehouses(demoWarehouses);
    } else {
      setWarehouses(storedWarehouses);
    }

    // Загрузка товаров
    const storedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    if (storedProducts.length === 0) {
      // Добавляем демо-товары, если их нет
      const demoProducts = [
        { id: '1', name: 'Смартфон X1', category: 'Электроника', purchasePrice: 15000, salePrice: 20000 },
        { id: '2', name: 'Ноутбук Pro', category: 'Электроника', purchasePrice: 45000, salePrice: 60000 },
        { id: '3', name: 'Наушники Wireless', category: 'Аксессуары', purchasePrice: 3000, salePrice: 4500 },
        { id: '4', name: 'Клавиатура Gamer', category: 'Периферия', purchasePrice: 5000, salePrice: 7000 },
        { id: '5', name: 'Мышь оптическая', category: 'Периферия', purchasePrice: 1500, salePrice: 2000 },
        { id: '6', name: 'Монитор 24"', category: 'Электроника', purchasePrice: 12000, salePrice: 15000 },
        { id: '7', name: 'Зарядное устройство', category: 'Аксессуары', purchasePrice: 800, salePrice: 1200 }
      ];
      localStorage.setItem('products', JSON.stringify(demoProducts));
      setProducts(demoProducts);
    } else {
      setProducts(storedProducts);
    }
  };

  // Обработчик изменения основных данных поставки
  const handleSupplyChange = (e) => {
    const { name, value } = e.target;
    setSupplyData(prev => ({ ...prev, [name]: value }));
  };

  // Обработчик изменения товара в поставке
  const handleItemChange = (index, field, value) => {
    const newItems = [...supplyItems];
    
    if (field === 'productId') {
      const selectedProduct = products.find(p => p.id === value);
      newItems[index] = { 
        ...newItems[index], 
        productId: value,
        price: selectedProduct ? selectedProduct.purchasePrice : 0
      };
    } else {
      newItems[index][field] = value;
    }
    
    setSupplyItems(newItems);
    calculateTotal(newItems);
  };

  // Добавление нового товара в поставку
  const addSupplyItem = () => {
    setSupplyItems([...supplyItems, { productId: '', quantity: 1, price: 0 }]);
  };

  // Удаление товара из поставки
  const removeSupplyItem = (index) => {
    if (supplyItems.length > 1) {
      const newItems = supplyItems.filter((_, i) => i !== index);
      setSupplyItems(newItems);
      calculateTotal(newItems);
    }
  };

  // Расчет общей суммы поставки
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    
    setSupplyData(prev => ({ ...prev, total }));
  };

  // Сохранение поставки
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Проверка на выбор 5 разных товаров
    const uniqueProducts = new Set(supplyItems.map(item => item.productId));
    if (uniqueProducts.size < 5) {
      alert('Для демонстрации требуется выбрать 5 разных товаров!');
      return;
    }

    // Генерация данных поставки
    const supplyId = Date.now().toString();
    const newSupply = {
      id: supplyId,
      ...supplyData,
      employeeId: currentUser.id,
      items: supplyItems.map(item => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: Number(item.quantity) * Number(item.price)
      })),
      createdAt: new Date().toISOString()
    };
    
    // Сохранение поставки в localStorage
    const supplies = JSON.parse(localStorage.getItem('supplies') || '[]');
    localStorage.setItem('supplies', JSON.stringify([...supplies, newSupply]));
    
    // Обновление товаров на складе
    updateWarehouseStock(newSupply);
    
    // Если поставка отмечена как оплаченная, регистрируем оплату
    if (newSupply.isPaid) {
      registerSupplyPayment(newSupply);
    }
    
    // Перенаправление на страницу оплаты или списка поставок
    if (!newSupply.isPaid) {
      navigate(`/supplies/pay-supply/${supplyId}`);
    } else {
      navigate('/supplies/supplier-debts');
      alert('Поставка успешно создана и оплачена!');
    }
  };

  // Обновление склада после поставки
  const updateWarehouseStock = (supply) => {
    const stock = JSON.parse(localStorage.getItem('warehouseStock') || '[]');
    
    // Добавляем новые записи о наличии товаров
    const newStockItems = supply.items.map(item => ({
      id: Date.now() + Math.random().toString().substring(2, 8),
      warehouseId: supply.warehouseId,
      productId: item.productId,
      quantity: item.quantity,
      supplyId: supply.id,
      price: item.price,
      date: new Date().toISOString()
    }));
    
    localStorage.setItem('warehouseStock', JSON.stringify([...stock, ...newStockItems]));
  };

  // Регистрация оплаты поставки
  const registerSupplyPayment = (supply) => {
    const payments = JSON.parse(localStorage.getItem('supplyPayments') || '[]');
    
    const payment = {
      id: Date.now().toString(),
      supplyId: supply.id,
      amount: supply.total,
      date: new Date().toISOString(),
      paymentType: supply.paymentType,
      employeeId: currentUser.id
    };
    
    localStorage.setItem('supplyPayments', JSON.stringify([...payments, payment]));
  };

  // Если данные еще загружаются
  if (!currentUser || suppliers.length === 0 || warehouses.length === 0 || products.length === 0) {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Создание поставки</h1>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
                  Поставщик
                </label>
                <select
                  id="supplierId"
                  name="supplierId"
                  required
                  value={supplyData.supplierId}
                  onChange={handleSupplyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите поставщика</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="warehouseId" className="block text-sm font-medium text-gray-700 mb-1">
                  Склад
                </label>
                <select
                  id="warehouseId"
                  name="warehouseId"
                  required
                  value={supplyData.warehouseId}
                  onChange={handleSupplyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Выберите склад</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.location})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Дата поставки
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={supplyData.date}
                  onChange={handleSupplyChange}
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
                  value={supplyData.paymentType}
                  onChange={handleSupplyChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="cash">Наличные</option>
                  <option value="card">Банковская карта</option>
                  <option value="transfer">Банковский перевод</option>
                </select>
              </div>
            </div>
            
            {/* Товары в поставке */}
            <div className="mt-8 mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Товары в поставке</h2>
              
              {supplyItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-center">
                  <div className="col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Выберите товар</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Кол-во"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Цена"
                    />
                  </div>
                  
                  <div className="col-span-2 text-right">
                    {(item.price * item.quantity).toFixed(2)} сом
                  </div>
                  
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeSupplyItem(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={supplyItems.length === 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addSupplyItem}
                className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Добавить товар
              </button>
            </div>
            
            {/* Итоговая сумма */}
            <div className="mt-8 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Итого:</span>
                <span>{supplyData.total.toFixed(2)} сом</span>
              </div>
              
              <div className="mt-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={supplyData.isPaid}
                    onChange={(e) => setSupplyData(prev => ({ ...prev, isPaid: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Отметить как оплаченную</span>
                </label>
              </div>
            </div>
            
            {/* Кнопки действий */}
            <div className="mt-8 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/mainpage')}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Отмена
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {supplyData.isPaid ? 'Создать и оплатить' : 'Создать поставку'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSupply;