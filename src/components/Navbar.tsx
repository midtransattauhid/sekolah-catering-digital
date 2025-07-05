
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, User, ShoppingBag, LogOut, Settings, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 bg-orange-500 text-white py-2 md:py-3 shadow-md">
      <div className="container mx-auto px-3 md:px-4 flex items-center justify-between">
        <Link to="/" className="text-lg md:text-2xl font-bold truncate">
          CateringKu
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 text-xs px-2 py-1"
            onClick={() => navigate('/')}
          >
            <Home className="h-3 w-3 mr-1" />
            Menu & Pesan
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 text-xs px-2 py-1"
            onClick={() => navigate('/children')}
          >
            <User className="h-3 w-3 mr-1" />
            Data Anak
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 text-xs px-2 py-1"
            onClick={() => navigate('/orders')}
          >
            <ShoppingBag className="h-3 w-3 mr-1" />
            Riwayat
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10 p-1 h-8 w-8"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-7 w-7 md:h-8 md:w-8 rounded-full p-0">
                <Avatar className="h-7 w-7 md:h-8 md:w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.full_name || "Avatar"} />
                  <AvatarFallback className="text-xs">{user?.user_metadata?.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 mr-2">
              <DropdownMenuLabel className="text-sm">Akun</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs">
                <User className="mr-2 h-3 w-3" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')} className="text-xs">
                <ShoppingBag className="mr-2 h-3 w-3" />
                <span>Pesanan</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')} className="text-xs">
                    <Settings className="mr-2 h-3 w-3" />
                    <span>Panel Admin</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-xs">
                <LogOut className="mr-2 h-3 w-3" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-orange-400 bg-orange-500">
          <div className="container mx-auto px-3 py-3 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 text-sm h-8"
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
            >
              <Home className="h-4 w-4 mr-2" />
              Menu & Pesan
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 text-sm h-8"
              onClick={() => {
                navigate('/children');
                setIsMobileMenuOpen(false);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Data Anak
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-white/10 text-sm h-8"
              onClick={() => {
                navigate('/orders');
                setIsMobileMenuOpen(false);
              }}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Riwayat Pesanan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
