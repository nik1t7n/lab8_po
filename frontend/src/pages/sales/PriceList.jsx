import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PriceList = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Проверка авторизации
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    setCurrentUser(user);
    
    // Загрузка данных товаров
    loadProducts();
  }, [navigate]);

  const loadProducts = () => {
    setLoading(true);
    
    // Загрузка товаров из localStorage
    const productsData = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Если нет товаров, создаем демо-данные
    if (productsData.length === 0) {
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
      
      // Получаем уникальные категории
      const uniqueCategories = [...new Set(demoProducts.map(product => product.category))];
      setCategories(uniqueCategories);
    } else {
      setProducts(productsData);
      
      // Получаем уникальные категории
      const uniqueCategories = [...new Set(productsData.map(product => product.category))];
      setCategories(uniqueCategories);
    }
    
    setLoading(false);
  };

  // Функция для фильтрации товаров
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Прайс-лист</h1>
          <Link 
            to="/mainpage" 
            className="px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>

        {/* Фильтры */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Поиск
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите название товара или категорию"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Номер
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория товара
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена товара
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.salePrice.toFixed(2)} сом
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Нет товаров соответствующих критериям поиска
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

export default PriceList;