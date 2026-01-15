import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNavbar from './MobileNavbar';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../services/api';
import CreateTaskModal from './modals/CreateTaskModal';
import CreateMemberTaskModal from './modals/CreateMemberTaskModal';
import CreateTeamModal from './modals/CreateTeamModal';
import AddMemberModal from './modals/AddMemberModal';
import InviteMemberModal from './modals/InviteMemberModal';
import BulkInviteModal from './modals/BulkInviteModal';
import BulkInviteTeamSelectorModal from './modals/BulkInviteTeamSelectorModal';

const Layout = () => {
    const { isAdmin } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Modal states
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isCreateMemberTaskModalOpen, setIsCreateMemberTaskModalOpen] = useState(false);
    const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
    const [isBulkInviteTeamSelectorOpen, setIsBulkInviteTeamSelectorOpen] = useState(false);
    const [isBulkInviteModalOpen, setIsBulkInviteModalOpen] = useState(false);
    const [selectedTeamForBulkInvite, setSelectedTeamForBulkInvite] = useState(null);

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
        fetchTeams();
    }, []);

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
        onCreateMemberTask: () => setIsCreateMemberTaskModalOpen(true),
        onCreateTeam: () => setIsCreateTeamModalOpen(true),
        onAddMember: () => setIsAddMemberModalOpen(true),
        onInviteMember: () => setIsInviteMemberModalOpen(true),
        onBulkInvite: () => setIsBulkInviteTeamSelectorOpen(true),
    };

    const handleTeamSelected = (team) => {
        setSelectedTeamForBulkInvite(team);
        setIsBulkInviteModalOpen(true);
    };

    const handleBulkInviteClose = () => {
        setIsBulkInviteModalOpen(false);
        setSelectedTeamForBulkInvite(null);
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
                    onCreateMemberTask={modalHandlers.onCreateMemberTask}
                    onCreateTeam={modalHandlers.onCreateTeam}
                    onAddMember={modalHandlers.onAddMember}
                    onInviteMember={modalHandlers.onInviteMember}
                    onBulkInvite={modalHandlers.onBulkInvite}
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
                <div className={`${isMobile ? 'p-5 sm:p-6' : 'p-6 md:p-8 lg:p-10'}`}>
                    <Outlet />
                </div>
            </main>

            {/* Global Modals */}
            {isAdmin && (
                <>
                    <CreateTaskModal
                        isOpen={isCreateTaskModalOpen}
                        onClose={() => setIsCreateTaskModalOpen(false)}
                        teams={teams}
                        onTaskCreated={() => {
                            setIsCreateTaskModalOpen(false);
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

                    <BulkInviteTeamSelectorModal
                        isOpen={isBulkInviteTeamSelectorOpen}
                        onClose={() => setIsBulkInviteTeamSelectorOpen(false)}
                        teams={teams}
                        onTeamSelected={handleTeamSelected}
                    />

                    <BulkInviteModal
                        isOpen={isBulkInviteModalOpen}
                        onClose={handleBulkInviteClose}
                        teamId={selectedTeamForBulkInvite?.id}
                        teamName={selectedTeamForBulkInvite?.name}
                    />
                </>
            )}

            {/* Member Modals */}
            {!isAdmin && (
                <>
                    <CreateMemberTaskModal
                        isOpen={isCreateMemberTaskModalOpen}
                        onClose={() => setIsCreateMemberTaskModalOpen(false)}
                        onTaskCreated={() => {
                            setIsCreateMemberTaskModalOpen(false);
                        }}
                    />

                    <CreateTeamModal
                        isOpen={isCreateTeamModalOpen}
                        onClose={() => setIsCreateTeamModalOpen(false)}
                        onTeamCreated={() => {
                            setIsCreateTeamModalOpen(false);
                            fetchTeams();
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default Layout;
