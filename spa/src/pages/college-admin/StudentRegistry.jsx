import { Search, UserPlus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/common/ToastProvider';

export default function StudentRegistry() {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Registration and Edit states
  const [formData, setFormData] = useState({ name: '', roll_no: '', password: '', rfid_uid: '' });
  const [editingStudent, setEditingStudent] = useState(null); // holds student object being edited
  const [editData, setEditData] = useState({ name: '', roll_no: '', rfid_uid: '', coins: 0, is_active: true });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/api/admin/students');
      if (data.success) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data } = await apiClient.post('/api/admin/student', formData);
      if (data.success) {
        addToast(data.message || 'Student added successfully!', 'success');
        setFormData({ name: '', roll_no: '', password: '', rfid_uid: '' });
        setShowForm(false);
        fetchStudents(); // Refresh table
      }
    } catch(err) {
      addToast(err.response?.data?.message || 'Failed to add student', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditData({
      name: student.name,
      roll_no: student.roll_no,
      rfid_uid: student.rfid_uid || '',
      coins: student.coins,
      is_active: student.is_active === 1 || student.is_active === true
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data } = await apiClient.put(`/api/admin/student/${editingStudent.id}`, editData);
      if (data.success) {
        addToast(data.message || 'Student updated successfully!', 'success');
        setEditingStudent(null);
        fetchStudents(); // Refresh table
      }
    } catch(err) {
      addToast(err.response?.data?.message || 'Failed to update student', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">Student Registry</h2>
          <p className="text-gray-500 font-bold opacity-80 mt-1">Manage and moderate student accounts manually</p>
        </div>
        <div className="flex space-x-4">
          <div className="relative">
            <input 
               type="text" 
               placeholder="Search by ID or Name..."
               className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-64 shadow-sm font-medium"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button onClick={() => setShowForm(!showForm)} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold flex items-center transition-all shadow-sm">
            {showForm ? <X className="w-5 h-5 mr-1" /> : <UserPlus className="w-5 h-5 mr-1" />}
            {showForm ? 'Close' : 'Add Student'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Register New Student</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Roll Number</label>
              <input type="text" required value={formData.roll_no} onChange={e => setFormData({...formData, roll_no: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white" placeholder="CS21001" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">RFID UID</label>
              <input type="text" required value={formData.rfid_uid} onChange={e => setFormData({...formData, rfid_uid: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary bg-gray-50 focus:bg-white" placeholder="12A34B56C" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" disabled={actionLoading} className="bg-success hover:bg-success/90 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-70 transition-colors shadow-sm">
                {actionLoading ? 'Registering...' : 'Register Student'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-xl relative">
            <button 
              onClick={() => setEditingStudent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-gray-800 mb-6">Edit Student Profile</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input type="text" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Roll Number</label>
                  <input type="text" required value={editData.roll_no} onChange={e => setEditData({...editData, roll_no: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">RFID UID</label>
                  <input type="text" value={editData.rfid_uid} onChange={e => setEditData({...editData, rfid_uid: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="flex items-center mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={editData.is_active} 
                  onChange={e => setEditData({...editData, is_active: e.target.checked})}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary mr-3"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 cursor-pointer">
                   Account Active (Disable to revoke login access)
                </label>
              </div>

              <div className="flex justify-end pt-4 space-x-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setEditingStudent(null)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                   Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold disabled:opacity-70 transition-colors shadow-sm">
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-gray-100">
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Student ID</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Name</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase">Wallet Balance</th>
              <th className="px-6 py-4 font-bold text-gray-500 text-sm tracking-widest uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-10 font-medium text-gray-500">Loading student directory...</td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 font-medium text-gray-500">No students registered yet.</td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${!student.is_active ? 'opacity-60' : ''}`}>
                   <td className="px-6 py-5 font-bold text-gray-800">{student.roll_no}</td>
                   <td className="px-6 py-5 font-medium text-gray-600">
                     {student.name}
                     {!student.is_active && <span className="ml-2 text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded uppercase">Suspended</span>}
                   </td>
                   <td className="px-6 py-5 font-black text-primary text-lg">{student.coins.toLocaleString()} <span className="text-sm font-bold text-gray-500 opacity-80">Coins</span></td>
                   <td className="px-6 py-5 text-right">
                     <button 
                       onClick={() => handleEditClick(student)}
                       className="text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 px-4 py-1.5 rounded-lg transition-colors"
                     >
                       Edit Profile
                     </button>
                   </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
