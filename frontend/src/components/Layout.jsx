import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../services/api';
import CreateTaskModal from './modals/CreateTaskModal';
import AddMemberModal from './modals/AddMemberModal';
import InviteMemberModal from './modals/InviteMemberModal';

const Layout = () => {
    const { isAdmin } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Modal states
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);

    // Data for modals
    const [teams, setTeams] = useState([]);

    // Fetch teams for modals
    useEffect(() => {
        if (isAdmin) {
            fetchTeams();
        }
    }, [isAdmin]);

    const fetchTeams = async () => {
        try {
            const response = await teamsAPI.getTeams();
            setTeams(response.data.teams || []);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        }
    };

    // Listen for sidebar state changes via CSS class observation
    useEffect(() => {
        const sidebar = document.querySelector('aside');
        if (sidebar) {
            const observer = new MutationObserver(() => {
                setSidebarCollapsed(sidebar.classList.contains('w-20'));
            });
            observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
            return () => observer.disconnect();
        }
    }, []);

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Sidebar
                onCreateTask={() => setIsCreateTaskModalOpen(true)}
                onAddMember={() => setIsAddMemberModalOpen(true)}
                onInviteMember={() => setIsInviteMemberModalOpen(true)}
            />

            {/* Main Content - with left margin for sidebar */}
            <main
                className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'
                    }`}
            >
                <div className="p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>

            {/* Global Modals for Sidebar Actions */}
            {isAdmin && (
                <>
                    <CreateTaskModal
                        isOpen={isCreateTaskModalOpen}
                        onClose={() => setIsCreateTaskModalOpen(false)}
                        teams={teams}
                        onTaskCreated={() => {
                            setIsCreateTaskModalOpen(false);
                            // Optionally refresh data
                        }}
                    />

                    <AddMemberModal
                        isOpen={isAddMemberModalOpen}
                        onClose={() => setIsAddMemberModalOpen(false)}
                        teams={teams}
                        onMemberAdded={() => {
                            // Optionally refresh data
                        }}
                    />

                    <InviteMemberModal
                        isOpen={isInviteMemberModalOpen}
                        onClose={() => setIsInviteMemberModalOpen(false)}
                        teams={teams}
                    />
                </>
            )}
        </div>
    );
};

export default Layout;
