'use client';

import { useProducts } from "@/lib/supabase/products/read";
import { deleteProduct } from "@/lib/supabase/products/write";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Edit2, Trash2, Package, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from '@/components/ui/button';

export default function ListView() {
  const [pageLimit, setPageLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: products, loading, error } = useProducts({ fetchAll: true });
  
  const [localProducts, setLocalProducts] = useState([]);
  const router = useRouter();

  // Update local state when products change
  useEffect(() => {
    if (products) {
      setLocalProducts(products);
    }
  }, [products]);

  // Filter products based on search
  const filteredProducts = localProducts.filter(product => 
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredProducts?.length || 0;
  const totalPages = Math.ceil(totalItems / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;
  const endIndex = startIndex + pageLimit;
  const paginatedProducts = filteredProducts?.slice(startIndex, endIndex) || [];

  // Reset to page 1 when pageLimit or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageLimit, searchQuery]);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center p-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-5 text-red-600 p-6 bg-red-50 rounded-xl border border-red-200">
        <p className="font-bold text-lg mb-2">⚠️ Error loading products</p>
        <p className="text-sm mb-1">{error.message}</p>
        <p className="text-xs text-red-500 mt-3">Check console for details</p>
      </div>
    );
  }

  if (!localProducts || localProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-gray-500">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Package size={56} className="text-gray-400" />
        </div>
        <p className="text-xl font-bold text-gray-700 mb-2">No products found</p>
        <p className="text-sm text-gray-500">Create your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 w-full">
      {/* Header with Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Products</h2>
            <p className="text-sm text-gray-500 mt-0.5">{totalItems} total products</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden xl:table-cell">
                  Brand
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                  Orders
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((item, index) => (
                  <Row 
                    key={item.id} 
                    item={item} 
                    index={startIndex + index}
                    router={router}
                    onDelete={(id) => {
                      setLocalProducts(prev => prev.filter(p => p.id !== id));
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search size={40} className="mb-3 text-gray-400" />
                      <p className="font-medium">No products match your search</p>
                      <p className="text-sm mt-1">Try adjusting your search terms</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button 
              size='sm' 
              variant="outline"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="w-full sm:w-auto"
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </span>
              <select
                value={pageLimit}
                onChange={(e) => setPageLimit(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            <Button 
              size='sm' 
              variant="outline"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto"
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ item, index, router, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setIsDeleting(true);
    try {
      await deleteProduct(item.id);
      toast.success("Product deleted successfully");
      onDelete(item.id);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/products/form?id=${item.id}`);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {index + 1}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              className="h-14 w-14 object-cover rounded-lg shadow-sm ring-1 ring-gray-200" 
              alt={item.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="56" height="56"%3E%3Crect fill="%23f3f4f6" width="56" height="56"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3ENo img%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="h-14 w-14 bg-gray-100 rounded-lg flex items-center justify-center ring-1 ring-gray-200">
              <Package size={24} className="text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate text-sm">
                {item.name}
              </p>
              {item.is_featured && (
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5 uppercase tracking-wide">
                  Featured
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Stock: <span className={`font-medium ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {item.stock || 0}
              </span>
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-base font-bold text-gray-900">
          ₹{parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell">
        <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
          {item.categoryName || 'N/A'}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap hidden xl:table-cell">
        <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
          {item.brandName || 'N/A'}
        </span>
      </td>
      <td className="px-4 py-4 text-center whitespace-nowrap hidden md:table-cell">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
          <Package size={14} />
          {item.orders || 0}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-center">
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleEdit}
            disabled={isDeleting}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-sm"
            title="Edit product"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-sm"
            title="Delete product"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}