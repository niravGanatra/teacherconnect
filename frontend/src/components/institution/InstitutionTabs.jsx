/**
 * Institution Tabs Component
 * Clean segmented/underline navigation for institution page sections.
 */
export default function InstitutionTabs({ activeTab, onTabChange, counts = {} }) {
    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'jobs', label: 'Jobs', count: counts.jobs },
        { id: 'alumni', label: 'Alumni', count: counts.alumni },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 px-2">
            <nav className="flex items-center gap-1 overflow-x-auto">
                {tabs.map((tab) => {
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`inline-flex items-center gap-2 py-3.5 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                active
                                    ? 'text-violet-700 border-violet-700'
                                    : 'text-slate-500 border-transparent hover:text-slate-800'
                            }`}
                        >
                            <span>{tab.label}</span>
                            {typeof tab.count === 'number' && tab.count > 0 && (
                                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                                    active ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
