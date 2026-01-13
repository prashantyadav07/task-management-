import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../services/api';
import CreateTaskModal from './modals/CreateTaskModal';
import AddMemberModal from './modals/AddMemberModal';
import InviteMemberModal from './modals/InviteMemberModal';

const Layout = () => {
    const { isAdmin } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Modal states
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);

    // Data for modals
    const [teams, setTeams] = useState([]);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Check on mount
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    // Modal handlers
    const modalHandlers = {
        onCreateTask: () => setIsCreateTaskModalOpen(true),
        onAddMember: () => setIsAddMemberModalOpen(true),
        onInviteMember: () => setIsInviteMemberModalOpen(true)
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Mobile Navigation */}
            {isMobile && (
                <MobileNavbar
                    onCreateTask={modalHandlers.onCreateTask}
                    onAddMember={modalHandlers.onAddMember}
                    onInviteMember={modalHandlers.onInviteMember}
                />
            )}

            {/* Desktop Sidebar */}
            {!isMobile && (
                <Sidebar
                    onCreateTask={modalHandlers.onCreateTask}
                    onAddMember={modalHandlers.onAddMember}
                    onInviteMember={modalHandlers.onInviteMember}
                />
            )}

            {/* Main Content */}
            <main
                className={`min-h-screen transition-all duration-300 ${isMobile
                        ? 'ml-0 pt-16'
                        : sidebarCollapsed
                            ? 'ml-20'
                            : 'ml-64'
                    }`}
            >
                <div className={`${isMobile ? 'p-4' : 'p-6 lg:p-8'}`}>
                    <Outlet />
                </div>
            </main>

            {/* Global Modals for Sidebar/Navbar Actions */}
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
