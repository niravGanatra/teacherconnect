/**
 * SkillsSection — Endorsements & Skills Validation component.
 *
 * Own profile  : Add / delete skills. Sees endorser avatars + counts.
 * Other profile: Endorse / un-endorse each skill. Optimistic UI updates.
 *
 * API endpoints used:
 *   GET    /api/profiles/{userId}/skills/            → list with endorsement data
 *   POST   /api/profiles/{userId}/skills/            → add skill (own only)
 *   DELETE /api/profiles/{userId}/skills/{skillId}/  → remove skill (own only)
 *   POST   /api/profiles/skills/{skillId}/endorse/   → endorse
 *   DELETE /api/profiles/skills/{skillId}/endorse/   → un-endorse
 */
import { useState, useEffect, useRef } from 'react';
import { Card } from '../common';
import {
    SparklesIcon,
    PlusIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { skillsAPI } from '../../services/api';

// ─── Avatar stack ───────────────────────────────────────────────────────────────

function AvatarStack({ endorsers, total }) {
    if (!endorsers || endorsers.length === 0) return null;
    const extra = Math.max(0, total - endorsers.length);

    return (
        <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
                {endorsers.map((endorser, i) => (
                    <div
                        key={endorser.id}
                        className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] overflow-hidden flex items-center justify-center text-[10px] text-white font-semibold shadow-sm flex-shrink-0"
                        style={{ zIndex: endorsers.length - i }}
                        title={endorser.name}
                    >
                        {endorser.avatar_url ? (
                            <img
                                src={endorser.avatar_url}
                                alt={endorser.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span>{endorser.name?.charAt(0)?.toUpperCase() || '?'}</span>
                        )}
                    </div>
                ))}
            </div>
            {extra > 0 && (
                <span className="text-xs text-slate-400">+{extra} more</span>
            )}
        </div>
    );
}

// ─── Single skill card ───────────────────────────────────────────────────────────

function SkillCard({ skill, isOwnProfile, onEndorse, onDelete, endorsingMap }) {
    const busy = !!endorsingMap[skill.id];

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all">
            {/* Left: name + endorser row */}
            <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-900 text-sm">{skill.name}</span>

                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <AvatarStack
                        endorsers={skill.top_endorsers}
                        total={skill.endorsement_count}
                    />
                    <span className="text-xs text-slate-500">
                        {skill.endorsement_count === 0
                            ? 'No endorsements yet'
                            : `${skill.endorsement_count} endorsement${skill.endorsement_count !== 1 ? 's' : ''}`}
                    </span>
                </div>
            </div>

            {/* Right: action button */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {/* Endorse / Endorsed toggle — other profiles only */}
                {!isOwnProfile && (
                    <button
                        onClick={() => onEndorse(skill.id, skill.is_endorsed_by_me)}
                        disabled={busy}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                            transition-all select-none
                            ${skill.is_endorsed_by_me
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200'
                                : 'bg-[#1e3a5f] text-white hover:bg-[#2d4a6f]'}
                            ${busy ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                    >
                        {skill.is_endorsed_by_me ? (
                            <>
                                <CheckIcon className="w-3.5 h-3.5" />
                                <span>Endorsed</span>
                            </>
                        ) : (
                            <span>Endorse</span>
                        )}
                    </button>
                )}

                {/* Delete button — own profile only */}
                {isOwnProfile && (
                    <button
                        onClick={() => onDelete(skill.id)}
                        title="Remove skill"
                        className="w-7 h-7 rounded-full flex items-center justify-center
                            text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────────

function SkillsSkeleton() {
    return (
        <div className="animate-pulse space-y-2.5">
            {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 bg-slate-100 rounded-xl" />
            ))}
        </div>
    );
}

// ─── Main component ──────────────────────────────────────────────────────────────

export default function SkillsSection({ userId, isOwnProfile, noCard = false }) {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSkillName, setNewSkillName] = useState('');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState('');
    // Map of skillId → boolean (endorse/unendorse request in-flight)
    const [endorsingMap, setEndorsingMap] = useState({});
    const inputRef = useRef(null);

    useEffect(() => {
        if (!userId) return;
        fetchSkills();
    }, [userId]);

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const res = await skillsAPI.listForUser(userId);
            setSkills(res.data);
        } catch (e) {
            console.error('Failed to fetch skills:', e);
        } finally {
            setLoading(false);
        }
    };

    // ── Add skill ────────────────────────────────────────────────────────────

    const handleAddSkill = async (e) => {
        e.preventDefault();
        const name = newSkillName.trim();
        if (!name) return;
        setAdding(true);
        setAddError('');
        try {
            const res = await skillsAPI.addForUser(userId, { name });
            setSkills((prev) => [...prev, res.data]);
            setNewSkillName('');
            inputRef.current?.focus();
        } catch (e) {
            const d = e.response?.data;
            const msg = d?.error || d?.name?.[0] || d?.detail || 'Failed to add skill.';
            setAddError(msg);
        } finally {
            setAdding(false);
        }
    };

    // ── Delete skill (optimistic) ─────────────────────────────────────────────

    const handleDeleteSkill = async (skillId) => {
        setSkills((prev) => prev.filter((s) => s.id !== skillId));
        try {
            await skillsAPI.deleteForUser(userId, skillId);
        } catch (e) {
            console.error('Delete failed:', e);
            fetchSkills(); // revert
        }
    };

    // ── Endorse / un-endorse (optimistic) ────────────────────────────────────

    const handleEndorse = async (skillId, currentlyEndorsed) => {
        // 1. Optimistic flip
        setSkills((prev) =>
            prev.map((s) =>
                s.id !== skillId
                    ? s
                    : {
                          ...s,
                          is_endorsed_by_me: !currentlyEndorsed,
                          endorsement_count: currentlyEndorsed
                              ? s.endorsement_count - 1
                              : s.endorsement_count + 1,
                      }
            )
        );
        setEndorsingMap((prev) => ({ ...prev, [skillId]: true }));

        try {
            if (currentlyEndorsed) {
                await skillsAPI.unendorse(skillId);
            } else {
                await skillsAPI.endorse(skillId);
            }
            // Refresh so top_endorsers avatars are accurate
            const res = await skillsAPI.listForUser(userId);
            setSkills(res.data);
        } catch (e) {
            console.error('Endorse action failed:', e);
            const errMsg = e.response?.data?.error;
            if (errMsg) alert(errMsg); // surface 400 self-endorse to user
            fetchSkills(); // revert
        } finally {
            setEndorsingMap((prev) => ({ ...prev, [skillId]: false }));
        }
    };

    // Don't render for other users if they have no skills
    if (!loading && skills.length === 0 && !isOwnProfile) return null;

    const inner = (
        <>
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <SparklesIcon className="w-5 h-5 text-[#1e3a5f]" />
                Skills &amp; Endorsements
            </h2>

            {loading ? (
                <SkillsSkeleton />
            ) : skills.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-3">No skills added yet.</p>
            ) : (
                <div className="space-y-2.5">
                    {skills.map((skill) => (
                        <SkillCard key={skill.id} skill={skill} isOwnProfile={isOwnProfile} onEndorse={handleEndorse} onDelete={handleDeleteSkill} endorsingMap={endorsingMap} />
                    ))}
                </div>
            )}

            {isOwnProfile && (
                <form onSubmit={handleAddSkill} className="mt-4 flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newSkillName}
                        onChange={(e) => { setNewSkillName(e.target.value); if (addError) setAddError(''); }}
                        placeholder="Add a skill (e.g. Lesson Planning)"
                        maxLength={100}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] placeholder:text-slate-400"
                    />
                    <button type="submit" disabled={adding || !newSkillName.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-semibold hover:bg-[#2d4a6f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        <PlusIcon className="w-4 h-4" />
                        {adding ? 'Adding…' : 'Add'}
                    </button>
                </form>
            )}

            {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
        </>
    );

    if (noCard) return <div>{inner}</div>;

    return <Card className="p-4 md:p-6">{inner}</Card>;
}
