import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Registration from './pages/Registration';
import './App.css';
import Login from './pages/Login';
import MainPage from './pages/MainPage';
import CreateSupply from './pages/supplies/CreateSupply';
import SupplierDebts from './pages/supplies/SuppliersDebt';
import PaySupply from './pages/supplies/PaySupply';
import EditSupply from './pages/supplies/EditSupply';
import Warehouses from './pages/supplies/Warehouses';
import WarehouseProducts from './pages/supplies/WarehouseProducts';
import TotalTurnover from './pages/accountant/TotalTurnover';
import BreakevenPoint from './pages/accountant/BreakevenPoint';
import ProfitLoss from './pages/accountant/ProfitLoss';
import CategoryTurnover from './pages/accountant/CategoryTurnover';
import EmployeeSalary from './pages/accountant/EmployeeSalary';
import Taxes from './pages/accountant/Taxes';
import PaymentTypeSales from './pages/accountant/PaymentTypeSales';
import PriceList from './pages/sales/PriceList';
import ProductsSales from './pages/sales/ProductSales';
import Orders from './pages/sales/Orders';
import ClientDebts from './pages/sales/ClientDebts';
import ClientSales from './pages/sales/ClientSales';
import EditOrder from './pages/sales/EditOrder';
import ProductStock from './pages/sales/ProductStock';
import CancelOrder from './pages/customer/CancelOrder';
import Discounts from './pages/customer/Discounts';
import PayOrders from './pages/customer/PayOrders';
import OrderDetails from './pages/customer/OrderDetails';
import CustomerPriceList from './pages/customer/CustomerPriceList';
import CustomerOrders from './pages/customer/CustomerOrders';
import FormStats from './pages/admin/FormStats';
import RegisterEmployee from './pages/admin/RegisterEmployee';
import ReportsCustomers from './pages/admin/ReportsCustomers';
import ReportsSales from './pages/admin/ReportsSales';
import ReportsSupplies from './pages/admin/ReportsSupplies';
import ReportsAccountant from './pages/admin/ReportsAccountant';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registration" element={<Registration />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/supplies/create-supply" element={<CreateSupply />} />
        <Route path="/supplies/supplier-debts" element={<SupplierDebts />} />
        <Route path="/supplies/pay-supplies" element={<PaySupply />} />
        <Route path="/supplies/edit-supply" element={<EditSupply />} />
        <Route path="/supplies/warehouses" element={<Warehouses />} />
        <Route path="/supplies/warehouse-products" element={<WarehouseProducts />} />
        {/* Accountant Routes */}
        <Route path="/accountant/total-turnover" element={<TotalTurnover />} />
        <Route path="/accountant/breakeven-point" element={<BreakevenPoint />} />
        <Route path="/accountant/profit-loss" element={<ProfitLoss />} />
        <Route path="/accountant/category-turnover" element={<CategoryTurnover />} />
        <Route path="/accountant/employee-salary" element={<EmployeeSalary />} />
        <Route path="/accountant/taxes" element={<Taxes />} />
        <Route path="/accountant/payment-type-sales" element={<PaymentTypeSales />} /> 
        {/* Sales */}
        <Route path="/sales/price-list" element={<PriceList />} />
        <Route path="/sales/products-sales" element={<ProductsSales />} />
        <Route path="/sales/orders" element={<Orders />} />
        <Route path="/sales/client-debts" element={<ClientDebts />} />
        <Route path="/sales/product-stock" element={<ProductStock />} />
        <Route path="/sales/edit-order" element={<EditOrder />} />
        <Route path="/sales/client-sales" element={<ClientSales />} /> 
        {/* customer */}
        <Route path="/customer/price-list" element={<CustomerPriceList />} />
        <Route path="/customer/order-details" element={<OrderDetails />} />
        <Route path="/customer/orders" element={<CustomerOrders />} />
        <Route path="/customer/cancel-order" element={<CancelOrder />} />
        <Route path="/customer/pay-orders" element={<PayOrders />} />
        <Route path="/customer/discounts" element={<Discounts />} />
        {/* admin */}
        <Route path="/admin/form-stats" element={<FormStats />} />
        <Route path="/admin/register-employee" element={<RegisterEmployee />} />
        <Route path="/admin/reports/customers" element={<ReportsCustomers />} />
        <Route path="/admin/reports/sales" element={<ReportsSales />} />
        <Route path="/admin/reports/supplies" element={<ReportsSupplies />} />
        <Route path="/admin/reports/accountant" element={<ReportsAccountant />} />
      </Routes> 
    </Router>
  );
}

export default App;