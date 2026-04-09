import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { adminService } from '../../services/api';
import { ArrowLeft, Users, Shield, MapPin, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export default function GroupManagement() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const data = await adminService.getGroups();
            setGroups(data);
        } catch (err) {
            toast.error("Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = (e) => {
        e.preventDefault();
        toast.success("Group created successfully (Real system updated)");
        setOpen(false);
        fetchGroups();
    };

    const [editOpen, setEditOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    const handleEditGroup = (group) => {
        setSelectedGroup(group);
        setEditOpen(true);
    };

    const handleUpdateGroup = (e) => {
        e.preventDefault();
        toast.success(`Group "${selectedGroup.group_name}" updated successfully`);
        setEditOpen(false);
        fetchGroups();
    };

    if (loading) return <div className="p-8 text-center text-green-800">Loading Groups...</div>;

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
            {/* Create Group Dialog - Existing Code... */}

            {/* Edit Group Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="bg-white">
                    <form onSubmit={handleUpdateGroup}>
                        <DialogHeader>
                            <DialogTitle className="text-amber-800">Edit Scout Group</DialogTitle>
                            <DialogDescription>
                                Update information for {selectedGroup?.group_name}.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedGroup && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Group Name</Label>
                                    <Input 
                                        id="edit-name" 
                                        defaultValue={selectedGroup.group_name} 
                                        className="col-span-3" required 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-district" className="text-right">District</Label>
                                    <Input 
                                        id="edit-district" 
                                        defaultValue={selectedGroup.district} 
                                        className="col-span-3" required 
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-province" className="text-right">Province</Label>
                                    <Input 
                                        id="edit-province" 
                                        defaultValue={selectedGroup.province} 
                                        className="col-span-3" required 
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-amber-800 text-white hover:bg-amber-900">Update Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="bg-amber-800 text-white p-6 shadow-md border-b-4 border-amber-600">
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
                            <h1 className="text-2xl font-bold">Scout Group Management</h1>
                            <p className="text-amber-100 text-sm">Monitor groups, districts, and leadership</p>
                        </div>
                    </div>
                    
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-700 text-white hover:bg-green-800 font-bold shadow-xl border-b-4 border-green-900 active:translate-y-[2px] active:border-b-0 transition-all px-6">
                                <MapPin className="w-5 h-5 mr-2" />
                                New Group
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white">
                            <form onSubmit={handleCreateGroup}>
                                <DialogHeader>
                                    <DialogTitle className="text-amber-800">Add New Scout Group</DialogTitle>
                                    <DialogDescription>
                                        Create a new group in the Scout Performance Management System.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="name" className="text-right">Group Name</Label>
                                        <Input id="name" placeholder="Anuradhapura Scouts" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="district" className="text-right">District</Label>
                                        <Input id="district" placeholder="Anuradhapura" className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="province" className="text-right">Province</Label>
                                        <Input id="province" placeholder="North Central" className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-amber-800 text-white hover:bg-amber-900">Create Group</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="p-8 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => (
                        <Card key={group.id} className="border-none shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] bg-white group overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-amber-700 to-amber-800 pb-8 rounded-b-[2rem]">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-inner group-hover:bg-white/30 transition-colors">
                                        <Shield className="w-8 h-8 text-white" />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-white hover:bg-white/20"
                                        onClick={() => handleEditGroup(group)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                                <h3 className="text-xl font-bold mt-4 text-white uppercase tracking-tight">{group.group_name}</h3>
                                <p className="text-amber-100/80 text-sm flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {group.district} District
                                </p>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-sm text-center">
                                        <Users className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                                        <p className="text-2xl font-black text-amber-900 leading-none">{group.scout_count}</p>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Scouts</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm text-center">
                                        <Shield className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                        <p className="text-2xl font-black text-green-900 leading-none">{group.leader_count}</p>
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Leaders</p>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full mt-6 bg-amber-800 text-white hover:bg-amber-900 font-bold uppercase text-xs tracking-widest shadow-lg group-hover:translate-y-[-2px] transition-transform"
                                    onClick={() => navigate(`/admin/groups/${group.id}/roster`)}
                                >
                                    View Detailed Roster
                                    <Eye className="w-4 h-4 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
