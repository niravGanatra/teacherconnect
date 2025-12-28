/**
 * Skills Section Component
 * LinkedIn-style skills list with add/delete
 */
import { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner, Badge } from '../common';
import EmptySectionState, { EMPTY_STATE_PRESETS } from '../common/EmptySectionState';
import { skillsAPI } from '../../services/api';
import {
    PlusIcon,
    XMarkIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export default function SkillsSection({ className = '' }) {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSkill, setNewSkill] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const response = await skillsAPI.list();
            // Handle both paginated (results) and plain array responses
            const data = response.data.results || response.data;
            setSkills(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch skills:', error);
            setSkills([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e?.preventDefault();
        if (!newSkill.trim()) return;

        setAdding(true);
        try {
            const response = await skillsAPI.create({ name: newSkill.trim() });
            setSkills(prev => [...prev, response.data]);
            setNewSkill('');
        } catch (error) {
            console.error('Failed to add skill:', error);
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        setSkills(prev => prev.filter(s => s.id !== id));
        try {
            await skillsAPI.delete(id);
        } catch (error) {
            fetchSkills(); // Rollback
        }
    };

    if (loading) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center justify-center h-32"><Spinner /></div>
            </Card>
        );
    }

    return (
        <Card className={`p-6 ${className}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                    <SparklesIcon className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
            </div>

            {/* Add Skill Form */}
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAdd(e)}
                />
                <Button type="submit" variant="secondary" loading={adding}>
                    <PlusIcon className="w-5 h-5" />
                </Button>
            </form>

            {/* Skills List */}
            {skills.length === 0 ? (
                <EmptySectionState
                    icon={SparklesIcon}
                    {...EMPTY_STATE_PRESETS.skills}
                    onAction={() => document.querySelector('input[placeholder="Add a skill..."]')?.focus()}
                />
            ) : (
                <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <Badge
                            key={skill.id}
                            variant="primary"
                            className="flex items-center gap-1 pr-1 py-1.5"
                        >
                            {skill.name}
                            {skill.endorsements_count > 0 && (
                                <span className="text-xs opacity-75">
                                    ({skill.endorsements_count})
                                </span>
                            )}
                            <button
                                onClick={() => handleDelete(skill.id)}
                                className="ml-1 p-0.5 hover:bg-white/20 rounded"
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </Card>
    );
}
