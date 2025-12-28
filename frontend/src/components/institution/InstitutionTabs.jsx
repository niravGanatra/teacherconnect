/**
 * Institution Tabs Component
 * Tab navigation for institution page sections
 */

export default function InstitutionTabs({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'home', label: 'Home' },
        { id: 'about', label: 'About' },
        { id: 'jobs', label: 'Jobs' },
        { id: 'alumni', label: 'Alumni' },
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <nav className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
                            flex-1 py-4 px-6 text-sm font-medium transition-all
                            border-b-2 
                            ${activeTab === tab.id
                                ? 'text-purple-600 border-purple-600 bg-purple-50/50'
                                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
