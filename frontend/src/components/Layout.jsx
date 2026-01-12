import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';

const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
            <Sidebar />

            {/* Main Content - with left margin for sidebar */}
            <main
                className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'
                    }`}
            >
                <div className="p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
