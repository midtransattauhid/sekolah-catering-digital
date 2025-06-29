
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Utensils, User, ShoppingCart, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <Utensils className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                FoodFlow
              </span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <Link to="/children">
                <Button 
                  variant={location.pathname === '/children' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Anak</span>
                </Button>
              </Link>
              
              <Link to="/orders">
                <Button 
                  variant={location.pathname === '/orders' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Pesanan</span>
                </Button>
              </Link>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => signOut()}
                className="flex items-center space-x-2"
              >
                <User className="h-4 w-4" />
                <span>Keluar</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
