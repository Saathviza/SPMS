import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/api';
import { ArrowLeft, UserPlus, Shield, User, Power, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await adminService.getUsers();
            setUsers(data);
        } catch (err) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (roleName) => {
        const colors = {
            'admin': 'bg-red-100 text-red-700 border-red-200',
            'leader': 'bg-green-100 text-green-700 border-green-200',
            'scout': 'bg-blue-100 text-blue-700 border-blue-200',
            'examiner': 'bg-purple-100 text-purple-700 border-purple-200'
        };
        const color = colors[roleName.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
        return <span className={`px-2 py-1 rounded-full text-xs font-bold border ${color} uppercase`}>{roleName}</span>;
    };

    if (loading) return <div className="p-8 text-center">Loading Users...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
             <div className="bg-green-800 text-white p-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            onClick={() => navigate('/admin/dashboard')}
                            className="text-white hover:bg-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">User Management</h1>
                            <p className="text-green-100 text-sm">Manage system users and permissions</p>
                        </div>
                    </div>
                    <Button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shadow-md">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full">
                <Card className="shadow-xl border-none">
                    <CardHeader className="bg-white border-b">
                        <CardTitle className="text-gray-800">All System Users</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Name</th>
                                        <th className="px-6 py-4 font-semibold">Email</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                                        {user.full_name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{user.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4">{getRoleBadge(user.role_name)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`flex items-center gap-1.5 text-sm ${user.status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-600' : 'bg-amber-600'}`}></div>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                        <Shield className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
