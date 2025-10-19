'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { 
  ShoppingBag, 
  Package, 
  Users, 
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [ordersByStatus, setOrdersByStatus] = useState([])

  const fetchOrdersStats = useCallback(async () => {
    try {
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')

      if (ordersError) throw ordersError

      // Only count non-cancelled orders for total revenue
      const activeOrders = allOrders?.filter(order => order.status !== 'cancelled') || []
      const totalRevenue = activeOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
      const totalOrders = allOrders?.length || 0

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayOrders = allOrders?.filter(order => new Date(order.created_at) >= today) || []
      // Only count today's non-cancelled orders for today's revenue
      const todayActiveOrders = todayOrders.filter(order => order.status !== 'cancelled')
      const todayRevenue = todayActiveOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      const pendingOrders = allOrders?.filter(order => order.status === 'pending').length || 0

      const statusCounts = allOrders?.reduce((acc, order) => {
        const status = order.status || 'pending'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})

      setOrdersByStatus(Object.entries(statusCounts || {}).map(([status, count]) => ({
        status,
        count
      })))

      return {
        totalRevenue,
        totalOrders,
        todayRevenue,
        todayOrders: todayOrders.length,
        pendingOrders
      }
    } catch (error) {
      console.error('Error fetching orders stats:', error)
      return {
        totalRevenue: 0,
        totalOrders: 0,
        todayRevenue: 0,
        todayOrders: 0,
        pendingOrders: 0
      }
    }
  }, [])

  const fetchProductsStats = useCallback(async () => {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('stock')

      if (error) throw error

      const totalProducts = products?.length || 0
      const lowStockProducts = products?.filter(p => p.stock < 10).length || 0

      return { totalProducts, lowStockProducts }
    } catch (error) {
      console.error('Error fetching products stats:', error)
      return { totalProducts: 0, lowStockProducts: 0 }
    }
  }, [])

  const fetchUsersStats = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      if (error) throw error

      return { totalUsers: count || 0 }
    } catch (error) {
      console.error('Error fetching users stats:', error)
      return { totalUsers: 0 }
    }
  }, [])

  const fetchRecentOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            products (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      return []
    }
  }, [])

  const fetchTopProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, orders, stock, price, image_url')
        .order('orders', { ascending: false })
        .limit(5)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error fetching top products:', error)
      return []
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)

      const [
        ordersData,
        productsData,
        usersData,
        recentOrdersData,
        topProductsData
      ] = await Promise.all([
        fetchOrdersStats(),
        fetchProductsStats(),
        fetchUsersStats(),
        fetchRecentOrders(),
        fetchTopProducts()
      ])

      setStats({
        ...ordersData,
        ...productsData,
        ...usersData
      })

      setRecentOrders(recentOrdersData)
      setTopProducts(topProductsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchOrdersStats, fetchProductsStats, fetchUsersStats, fetchRecentOrders, fetchTopProducts])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            icon={<IndianRupee className="text-green-600" size={24} />}
            trend="+12.5%"
            trendUp={true}
            bgColor="bg-green-50"
          />

          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            icon={<ShoppingBag className="text-blue-600" size={24} />}
            trend="+8.2%"
            trendUp={true}
            bgColor="bg-blue-50"
          />

          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            icon={<Package className="text-purple-600" size={24} />}
            subtitle={`${stats.lowStockProducts} low stock`}
            bgColor="bg-purple-50"
          />

          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="text-orange-600" size={24} />}
            trend="+5.1%"
            trendUp={true}
            bgColor="bg-orange-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Today&apos;s Revenue</h3>
              <Calendar size={24} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">₹{stats.todayRevenue.toLocaleString()}</p>
            <p className="text-sm opacity-80">{stats.todayOrders} orders today</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Pending Orders</h3>
              <Clock size={24} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{stats.pendingOrders}</p>
            <Link href="/admin/orders">
              <button className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">
                View Orders →
              </button>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">Low Stock Alert</h3>
              <AlertCircle size={24} className="opacity-80" />
            </div>
            <p className="text-3xl font-bold mb-2">{stats.lowStockProducts}</p>
            <Link href="/admin/products">
              <button className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors">
                View Products →
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </button>
              </Link>
            </div>

            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.order_items?.reduce((sum, item) => sum + item.quantity, 0)} items • 
                        ₹{order.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <Link href={`/admin/orders/${order.id}`}>
                      <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye size={18} className="text-blue-600" />
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Products</h2>
              <Link href="/admin/products">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View All →
                </button>
              </Link>
            </div>

            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {product.orders} orders • Stock: {product.stock}
                      </p>
                    </div>
                    <p className="font-bold text-green-600">
                      ₹{product.price.toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No products yet</p>
              )}
            </div>
          </div>
        </div>

        {ordersByStatus.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Orders by Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {ordersByStatus.map(({ status, count }) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <StatusIcon status={status} />
                  <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
                  <p className="text-sm text-gray-600 capitalize mt-1">{status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/products/form">
            <button className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold">
              + Add Product
            </button>
          </Link>
          <Link href="/admin/orders">
            <button className="w-full p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold">
              View Orders
            </button>
          </Link>
          <Link href="/admin/products">
            <button className="w-full p-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold">
              Manage Products
            </button>
          </Link>
          <Link href="/admin/categories">
            <button className="w-full p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-semibold">
              Categories
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, trend, trendUp, subtitle, bgColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend}
          </div>
        )}
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-700',
    packed: 'bg-blue-100 text-blue-700',
    'picked up': 'bg-purple-100 text-purple-700',
    'in transit': 'bg-indigo-100 text-indigo-700',
    'out for delivery': 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${colors[status?.toLowerCase()] || colors.pending}`}>
      {status}
    </span>
  )
}

function StatusIcon({ status }) {
  const iconProps = { size: 32, className: "mx-auto" }
  
  const icons = {
    pending: <Clock {...iconProps} className="mx-auto text-yellow-500" />,
    packed: <Package {...iconProps} className="mx-auto text-blue-500" />,
    'picked up': <Package {...iconProps} className="mx-auto text-purple-500" />,
    'in transit': <Package {...iconProps} className="mx-auto text-indigo-500" />,
    'out for delivery': <Package {...iconProps} className="mx-auto text-orange-500" />,
    delivered: <CheckCircle {...iconProps} className="mx-auto text-green-500" />,
    cancelled: <XCircle {...iconProps} className="mx-auto text-red-500" />,
  }

  return icons[status?.toLowerCase()] || icons.pending
}