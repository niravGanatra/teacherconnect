import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { learnerAPI } from '../../services/api';

const GRADE_OPTIONS = [
    'Primary', 'Secondary', 'Senior Secondary', 'UG', 'PG',
    'Test Prep', 'Corporate training', 'IT or Technical education', 'Ai courses'
];

const SUBJECT_OPTIONS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
    'Social Studies', 'History', 'Geography', 'Economics', 'Commerce',
    'Computer Science', 'Physical Education', 'Art', 'Music', 'Sanskrit',
    'French', 'German', 'Spanish', 'Environmental Science', 'Psychology',
    'Political Science', 'Sociology', 'Accountancy', 'Business Studies', 'Other'
];

export default function LearnerOnboarding() {
    const [step, setStep] = useState(1);
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const toggleSelection = (item, list, setList) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        setError('');
        try {
            await learnerAPI.updateProfile({
                interested_grades: grades,
                interested_subjects: subjects,
            });
            navigate('/acadservices');
        } catch {
            setError('Could not save preferences. Continuing anyway…');
            setTimeout(() => navigate('/acadservices'), 1500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-2xl w-full p-8 md:p-12">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4">
                        <BookOpen className="w-8 h-8 text-[#1e3a5f]" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">What are you looking for?</h1>
                    <p className="text-slate-500">Tell us your interests so we can personalise your experience.</p>
                </div>

                {/* Step 1: Grades */}
                {step === 1 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-slate-800">Select Grades or Levels</h2>
                        <div className="flex flex-wrap gap-3">
                            {GRADE_OPTIONS.map(grade => {
                                const selected = grades.includes(grade);
                                return (
                                    <button
                                        key={grade}
                                        onClick={() => toggleSelection(grade, grades, setGrades)}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                            selected
                                            ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {grade}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end pt-8">
                            <button
                                onClick={() => setStep(2)}
                                disabled={grades.length === 0}
                                className="flex items-center gap-2 bg-[#1e3a5f] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#162e4e] transition-colors disabled:opacity-50"
                            >
                                Next Step <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Subjects */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-800">Select Subjects of Interest</h2>
                            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:underline">Back</button>
                        </div>
                        <div className="flex flex-wrap gap-2.5 max-h-[40vh] overflow-y-auto pr-2">
                            {SUBJECT_OPTIONS.map(subject => {
                                const selected = subjects.includes(subject);
                                return (
                                    <button
                                        key={subject}
                                        onClick={() => toggleSelection(subject, subjects, setSubjects)}
                                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                                            selected
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {subject}
                                    </button>
                                );
                            })}
                        </div>

                        {error && (
                            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <>Saving…</>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" /> Let's Go
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Progress Indicators */}
                <div className="flex justify-center mt-10 gap-2">
                    <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 1 ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 2 ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`} />
                </div>
            </div>
        </div>
    );
}
