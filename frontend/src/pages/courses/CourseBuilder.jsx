/**
 * CourseBuilder Component
 * Instructor UI for creating and editing courses.
 * Supports drag-and-drop for sections and lessons.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, Button, Input, Spinner } from '../../components/common';
import { DashboardLayout } from '../../components/common/Sidebar';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import { coursesAPI } from '../../services/api';
import {
    PlusIcon,
    TrashIcon,
    Bars3Icon,
    PlayCircleIcon,
    DocumentIcon,
    PencilIcon,
    EyeIcon,
    ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

export default function CourseBuilder() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Course data
    const [course, setCourse] = useState({
        title: '',
        subtitle: '',
        description: '',
        price: 0,
        difficulty: 'BEGINNER',
        language: 'EN',
        is_published: false,
        issue_certificate: true,
        what_you_learn: [],
        requirements: [],
    });

    const [sections, setSections] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [showMediaUploader, setShowMediaUploader] = useState(false);
    const [uploadingLesson, setUploadingLesson] = useState(null);

    const isNewCourse = !courseId || courseId === 'new';

    useEffect(() => {
        if (!isNewCourse) {
            fetchCourse();
        } else {
            setLoading(false);
        }
    }, [courseId]);

    const fetchCourse = async () => {
        try {
            const response = await coursesAPI.getInstructorCourse(courseId);
            setCourse(response.data);
            setSections(response.data.sections || []);
        } catch (error) {
            console.error('Failed to fetch course:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveCourse = async () => {
        setSaving(true);
        try {
            if (isNewCourse) {
                const response = await coursesAPI.createCourse(course);
                navigate(`/instructor/courses/${response.data.id}`);
            } else {
                await coursesAPI.updateCourse(courseId, course);
            }
        } catch (error) {
            console.error('Failed to save course:', error);
        } finally {
            setSaving(false);
        }
    };

    // Section management
    const addSection = async () => {
        if (isNewCourse) {
            setSections([...sections, { id: Date.now(), title: 'New Section', lessons: [] }]);
            return;
        }

        try {
            const response = await coursesAPI.addSection(courseId, { title: 'New Section' });
            setSections([...sections, { ...response.data, lessons: [] }]);
        } catch (error) {
            console.error('Failed to add section:', error);
        }
    };

    const updateSection = (sectionId, updates) => {
        setSections(sections.map(s =>
            s.id === sectionId ? { ...s, ...updates } : s
        ));
    };

    const deleteSection = (sectionId) => {
        if (window.confirm('Delete this section and all its lessons?')) {
            setSections(sections.filter(s => s.id !== sectionId));
        }
    };

    // Lesson management
    const addLesson = async (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        const newLesson = {
            id: Date.now(),
            title: 'New Lesson',
            content_type: 'VIDEO',
            duration_minutes: 0,
            is_preview: false,
        };

        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, lessons: [...(s.lessons || []), newLesson] }
                : s
        ));
    };

    const updateLesson = (sectionId, lessonId, updates) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? {
                    ...s,
                    lessons: s.lessons.map(l =>
                        l.id === lessonId ? { ...l, ...updates } : l
                    )
                }
                : s
        ));
    };

    const deleteLesson = (sectionId, lessonId) => {
        setSections(sections.map(s =>
            s.id === sectionId
                ? { ...s, lessons: s.lessons.filter(l => l.id !== lessonId) }
                : s
        ));
    };

    // Drag and drop
    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { type, source, destination } = result;

        if (type === 'section') {
            const reordered = Array.from(sections);
            const [moved] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, moved);
            setSections(reordered);
        } else if (type === 'lesson') {
            const sourceSectionId = source.droppableId;
            const destSectionId = destination.droppableId;

            if (sourceSectionId === destSectionId) {
                // Reorder within same section
                setSections(sections.map(s => {
                    if (s.id.toString() === sourceSectionId) {
                        const lessons = Array.from(s.lessons);
                        const [moved] = lessons.splice(source.index, 1);
                        lessons.splice(destination.index, 0, moved);
                        return { ...s, lessons };
                    }
                    return s;
                }));
            } else {
                // Move between sections
                let movedLesson;
                const newSections = sections.map(s => {
                    if (s.id.toString() === sourceSectionId) {
                        const lessons = Array.from(s.lessons);
                        [movedLesson] = lessons.splice(source.index, 1);
                        return { ...s, lessons };
                    }
                    return s;
                }).map(s => {
                    if (s.id.toString() === destSectionId && movedLesson) {
                        const lessons = Array.from(s.lessons);
                        lessons.splice(destination.index, 0, movedLesson);
                        return { ...s, lessons };
                    }
                    return s;
                });
                setSections(newSections);
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Spinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex gap-6">
                {/* Main Content */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-slate-800">
                            {isNewCourse ? 'Create Course' : 'Edit Course'}
                        </h1>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => navigate('/instructor/courses')}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={saveCourse} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>

                    {/* Course Info */}
                    <Card className="p-6 mb-6">
                        <h2 className="font-semibold text-slate-800 mb-4">Course Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                                <Input
                                    value={course.title}
                                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                    placeholder="e.g., Advanced Teaching Methodologies"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subtitle</label>
                                <Input
                                    value={course.subtitle}
                                    onChange={(e) => setCourse({ ...course, subtitle: e.target.value })}
                                    placeholder="A brief description"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={course.description}
                                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Detailed course description..."
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Curriculum */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-slate-800">Curriculum</h2>
                            <Button variant="outline" size="sm" onClick={addSection}>
                                <PlusIcon className="w-4 h-4 mr-1" />
                                Add Section
                            </Button>
                        </div>

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="sections" type="section">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                        {sections.map((section, index) => (
                                            <Draggable key={section.id} draggableId={section.id.toString()} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`border rounded-lg ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                    >
                                                        {/* Section Header */}
                                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-t-lg">
                                                            <div {...provided.dragHandleProps} className="cursor-grab">
                                                                <Bars3Icon className="w-5 h-5 text-slate-400" />
                                                            </div>
                                                            <Input
                                                                value={section.title}
                                                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                                                className="flex-1 font-medium"
                                                            />
                                                            <button
                                                                onClick={() => deleteSection(section.id)}
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <TrashIcon className="w-5 h-5" />
                                                            </button>
                                                        </div>

                                                        {/* Lessons */}
                                                        <Droppable droppableId={section.id.toString()} type="lesson">
                                                            {(provided) => (
                                                                <div ref={provided.innerRef} {...provided.droppableProps} className="p-4 space-y-2">
                                                                    {(section.lessons || []).map((lesson, lessonIndex) => (
                                                                        <Draggable key={lesson.id} draggableId={`lesson-${lesson.id}`} index={lessonIndex}>
                                                                            {(provided, snapshot) => (
                                                                                <div
                                                                                    ref={provided.innerRef}
                                                                                    {...provided.draggableProps}
                                                                                    className={`flex items-center gap-3 p-3 bg-white border rounded ${snapshot.isDragging ? 'shadow' : ''
                                                                                        }`}
                                                                                >
                                                                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                                                                        <Bars3Icon className="w-4 h-4 text-slate-400" />
                                                                                    </div>
                                                                                    {lesson.content_type === 'VIDEO' ? (
                                                                                        <PlayCircleIcon className="w-5 h-5 text-blue-500" />
                                                                                    ) : (
                                                                                        <DocumentIcon className="w-5 h-5 text-orange-500" />
                                                                                    )}
                                                                                    <Input
                                                                                        value={lesson.title}
                                                                                        onChange={(e) => updateLesson(section.id, lesson.id, { title: e.target.value })}
                                                                                        className="flex-1"
                                                                                    />
                                                                                    <span className="text-xs text-slate-500">
                                                                                        {lesson.duration_minutes}m
                                                                                    </span>
                                                                                    {lesson.is_preview && (
                                                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                                                                            Preview
                                                                                        </span>
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setUploadingLesson({ sectionId: section.id, lessonId: lesson.id });
                                                                                            setShowMediaUploader(true);
                                                                                        }}
                                                                                        className="text-slate-400 hover:text-blue-600"
                                                                                    >
                                                                                        <ArrowUpTrayIcon className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => deleteLesson(section.id, lesson.id)}
                                                                                        className="text-slate-400 hover:text-red-500"
                                                                                    >
                                                                                        <TrashIcon className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}

                                                                    <button
                                                                        onClick={() => addLesson(section.id)}
                                                                        className="flex items-center gap-2 w-full p-3 text-sm text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded border-dashed border-2 border-slate-200"
                                                                    >
                                                                        <PlusIcon className="w-4 h-4" />
                                                                        Add Lesson
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </Droppable>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        {sections.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                <p>No sections yet. Click "Add Section" to get started.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="w-80 flex-shrink-0 space-y-4">
                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Pricing</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                                <Input
                                    type="number"
                                    value={course.price}
                                    onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                                    placeholder="0 = Free"
                                />
                                <p className="text-xs text-slate-500 mt-1">Set to 0 for free courses</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Settings</h3>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Difficulty</label>
                                    <select
                                        value={course.difficulty}
                                        onChange={(e) => setCourse({ ...course, difficulty: e.target.value })}
                                        className="w-full text-sm border rounded px-2 py-1"
                                    >
                                        <option value="BEGINNER">Beginner</option>
                                        <option value="INTERMEDIATE">Intermediate</option>
                                        <option value="ADVANCED">Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Language</label>
                                    <select
                                        value={course.language}
                                        onChange={(e) => setCourse({ ...course, language: e.target.value })}
                                        className="w-full text-sm border rounded px-2 py-1"
                                    >
                                        <option value="EN">English</option>
                                        <option value="HI">Hindi</option>
                                        <option value="REGIONAL">Regional</option>
                                    </select>
                                </div>
                            </div>

                            <ToggleSwitch
                                label="Issue Certificate"
                                checked={course.issue_certificate}
                                onChange={(val) => setCourse({ ...course, issue_certificate: val })}
                            />

                            <ToggleSwitch
                                label="Published"
                                checked={course.is_published}
                                onChange={(val) => setCourse({ ...course, is_published: val })}
                            />
                        </div>
                    </Card>

                    <Card className="p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Thumbnail</h3>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">Upload thumbnail</p>
                            <input type="file" accept="image/*" className="hidden" />
                        </div>
                    </Card>
                </div>
            </div>

            {/* Media Uploader Modal */}
            {showMediaUploader && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg p-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Add Content</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <button className="flex flex-col items-center gap-2 p-6 border-2 rounded-lg hover:border-blue-500">
                                <PlayCircleIcon className="w-8 h-8 text-blue-500" />
                                <span className="text-sm">Video</span>
                            </button>
                            <button className="flex flex-col items-center gap-2 p-6 border-2 rounded-lg hover:border-orange-500">
                                <DocumentIcon className="w-8 h-8 text-orange-500" />
                                <span className="text-sm">PDF</span>
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
                            <Input placeholder="https://youtube.com/..." />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowMediaUploader(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={() => setShowMediaUploader(false)}>
                                Save
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </DashboardLayout>
    );
}
