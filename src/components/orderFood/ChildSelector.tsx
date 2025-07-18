
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Child {
  id: string;
  name: string;
  class_name: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChild: string;
  onChildSelect: (childId: string) => void;
}

const ChildSelector = ({ children, selectedChild, onChildSelect }: ChildSelectorProps) => {
  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center text-orange-700">
          <User className="h-5 w-5 mr-2 text-orange-600" />
          Pilih Anak untuk Menu
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Belum ada data anak</p>
            <Link to="/children">
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                Tambah Data Anak
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <Select value={selectedChild} onValueChange={onChildSelect}>
              <SelectTrigger className="border-orange-200 focus:border-orange-500">
                <SelectValue placeholder="Pilih anak untuk menu ini..." />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - Kelas {child.class_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChild && (
              <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                💡 Menu yang Anda tambahkan akan untuk {children.find(c => c.id === selectedChild)?.name}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChildSelector;
