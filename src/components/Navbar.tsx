
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
    <div className="bg-orange-500 text-white py-3 md:py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="text-xl md:text-2xl font-bold">
          CateringKu
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Menu & Pesan
          </Button>
          
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate('/children')}
          >
            <User className="h-4 w-4 mr-2" />
            Data Anak
          </Button>
          
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate('/orders')}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Riwayat Pesanan
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:bg-white/10 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.full_name || "Avatar"} />
                  <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2">
              <DropdownMenuLabel>Akun</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                <ShoppingBag className="mr-2 h-4 w-4" />
                <span>Pesanan</span>
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Panel Admin</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-orange-500 border-t border-orange-400 md:hidden z-50">
            <div className="container mx-auto px-4 py-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/10"
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
                className="w-full justify-start text-white hover:bg-white/10"
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
                className="w-full justify-start text-white hover:bg-white/10"
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
    </div>
  );
};

export default Navbar;
