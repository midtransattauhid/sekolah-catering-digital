
import { CategoryManager } from '@/components/admin/CategoryManager';

const CategoryManagement = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Manajemen Kategori
          </h1>
          <p className="text-gray-600">Kelola kategori menu makanan dan minuman</p>
        </div>
        
        <CategoryManager />
      </div>
    </div>
  );
};

export default CategoryManagement;
