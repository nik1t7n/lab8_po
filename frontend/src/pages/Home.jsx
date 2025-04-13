import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-8">Hello</h1>
        <p className="text-xl mb-10 text-gray-500">
          Добро пожаловать на нашу минималистичную страницу
        </p>
        <Link 
          to="/registration" 
          className="inline-block px-8 py-3 rounded-lg bg-black text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Регистрация
        </Link>
      </div>
    </div>
  );
};

export default Home;