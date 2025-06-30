import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, User, ShoppingBag, CalendarIcon, LogOut } from "lucide-react";

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

interface NavbarProps {
  
}

const Navbar: React.FC<NavbarProps> = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-orange-500 text-white py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          CateringKu
        </Link>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Menu
          </Button>
          
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => navigate('/order-food')}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Pesan Katering
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
            <DropdownMenuItem>
              <ShoppingBag className="mr-2 h-4 w-4" />
              <span>Pesanan</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Keluar</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;
