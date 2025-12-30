import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Image as ImageIcon, Video as VideoIcon, FileText, Smile, Plus, Play, Loader2 } from 'lucide-react';
import { feedAPI } from '../../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]); // Array of { id, file, type, preview, status: 'uploading'|'done'|'error' }
    const [isPosting, setIsPosting] = useState(false);
    const textareaRef = useRef(null);
    const DRAFT_KEY = 'post_draft_content';

    // Load draft on mount
    useEffect(() => {
        if (isOpen) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setText(parsed.text || '');
                    // We cannot easily restore file objects/previews from localStorage without re-uploading or complex logic.
                    // For now, we only restore text draft.
                } catch (e) {
                    console.error("Error parsing draft", e);
                }
            }
        }
    }, [isOpen]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    const handleClose = () => {
        if ((text.trim() || attachments.length > 0) && !isPosting) {
            if (window.confirm("Save this post as a draft?")) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify({ text }));
            } else {
                localStorage.removeItem(DRAFT_KEY);
                setText('');
                setAttachments([]);
            }
        }
        onClose();
    };

    const validateFiles = (newFiles) => {
        const currentTypes = new Set(attachments.map(a => a.type));

        for (const file of newFiles) {
            let type = 'IMAGE';
            if (file.type.startsWith('video/')) type = 'VIDEO';
            if (file.type === 'application/pdf') type = 'DOCUMENT';

            // LinkedIn Rule: Video XOR Document
            if (type === 'VIDEO' && (currentTypes.has('DOCUMENT') || attachments.some(a => a.type === 'DOCUMENT'))) {
                alert("You cannot attach both a Video and a Document.");
                return false;
            }
            if (type === 'DOCUMENT' && (currentTypes.has('VIDEO') || attachments.some(a => a.type === 'VIDEO'))) {
                alert("You cannot attach both a Document and a Video.");
                return false;
            }
            // If Video, can we have Images? LinkedIn allows logic varies, but usually mix is restricted or tricky.
            // Requirement says: "Ensure a post cannot have both a Video and a Document... but can have multiple Images."
            // Implicitly, Video + Images might be okay, or Video only. 
            // Let's allow Images with anything for now, unless strict mode is asked. 
            // "Mode Switching: If user uploads Video, disable Image/Document buttons." -> Strict Mode.

            if (type === 'VIDEO' && attachments.length > 0) {
                // If there are existing items, they must be removed or this is invalid if we want strict mode.
                // Requirement: "If the user uploads a Video, disable the Image/Document buttons."
                // This implies Video is exclusive? 
                // Let's enforce exclusivity for Video and Document. Images can be multiple.
                // If Video is uploaded, it should be the ONLY thing? 
                // "Post... can have multiple Images." 
                // Let's assume:
                // 1. Text + Images (Multiple)
                // 2. Text + Video (Single)
                // 3. Text + Document (Single)

                if (attachments.length > 0) {
                    alert("Video must be the only attachment.");
                    return false;
                }
            }

            if (type === 'DOCUMENT' && attachments.length > 0) {
                if (attachments.length > 0) {
                    alert("Document must be the only attachment.");
                    return false;
                }
            }

            if (type === 'IMAGE' && (currentTypes.has('VIDEO') || currentTypes.has('DOCUMENT'))) {
                alert("Cannot add images to a Video or Document post.");
                return false;
            }
        }
        return true;
    };

    const onDrop = async (acceptedFiles) => {
        if (!validateFiles(acceptedFiles)) return;

        const newAttachments = acceptedFiles.map(file => {
            let type = 'IMAGE';
            if (file.type.startsWith('video/')) type = 'VIDEO';
            if (file.type === 'application/pdf') type = 'DOCUMENT';

            return {
                id: null, // to be filled by upload
                tempId: Math.random().toString(36).substr(2, 9),
                file,
                type,
                preview: type === 'IMAGE' ? URL.createObjectURL(file) : null,
                name: file.name,
                size: file.size,
                status: 'uploading'
            };
        });

        setAttachments(prev => [...prev, ...newAttachments]);

        // Upload each
        for (const att of newAttachments) {
            const formData = new FormData();
            formData.append('file', att.file);
            formData.append('media_type', att.type);

            try {
                const response = await feedAPI.uploadMedia(formData);
                setAttachments(prev => prev.map(p =>
                    p.tempId === att.tempId ? { ...p, id: response.data.id, status: 'done' } : p
                ));
            } catch (error) {
                console.error("Upload failed", error);
                setAttachments(prev => prev.map(p =>
                    p.tempId === att.tempId ? { ...p, status: 'error' } : p
                ));
            }
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    const handlePost = async () => {
        if (isPosting) return;
        if (!text.trim() && attachments.length === 0) return;

        // Ensure all uploads are done
        if (attachments.some(a => a.status === 'uploading')) {
            alert("Please wait for uploads to finish.");
            return;
        }
        if (attachments.some(a => a.status === 'error')) {
            alert("Some uploads failed. Please remove them.");
            return;
        }

        setIsPosting(true);
        try {
            const mediaIds = attachments.map(a => a.id);
            await feedAPI.createPost({
                content: text,
                media_ids: mediaIds
            });
            localStorage.removeItem(DRAFT_KEY);
            onPostCreated();
            onClose();
        } catch (error) {
            console.error("Post creation failed", error);
            alert("Failed to create post.");
        } finally {
            setIsPosting(false);
        }
    };

    const removeAttachment = (tempId) => {
        setAttachments(prev => prev.filter(a => a.tempId !== tempId));
    };

    // Determine current mode to disable buttons
    const hasVideo = attachments.some(a => a.type === 'VIDEO');
    const hasDocument = attachments.some(a => a.type === 'DOCUMENT');
    const hasImages = attachments.some(a => a.type === 'IMAGE');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Create a post</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {/* User Info (Placeholder) */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-gray-800">You</p>
                            <p className="text-xs text-gray-500">Post to Anyone</p>
                        </div>
                    </div>

                    {/* Text Area */}
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="What doy you want to talk about?"
                        className="w-full resize-none outline-none text-lg text-gray-700 min-h-[100px]"
                    />

                    {/* Previews */}
                    {attachments.length > 0 && (
                        <div className="mt-4">
                            {/* Images Grid */}
                            {hasImages && (
                                <div className="grid grid-cols-2 gap-2">
                                    {attachments.map((att, index) => (
                                        <div key={att.tempId} className={`relative rounded-lg overflow-hidden border ${index === 0 && attachments.length === 1 ? 'col-span-2' : ''} ${index > 1 ? 'hidden' : ''}`}>
                                            <img src={att.preview} alt="preview" className="w-full h-48 object-cover" />
                                            {att.status === 'uploading' && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                                                    <Loader2 className="animate-spin" />
                                                </div>
                                            )}
                                            <button onClick={() => removeAttachment(att.tempId)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                                                <X size={16} />
                                            </button>
                                            {/* +X Overlay */}
                                            {index === 1 && attachments.length > 2 && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-2xl font-bold">
                                                    +{attachments.length - 2}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Video Preview */}
                            {hasVideo && attachments.map(att => (
                                <div key={att.tempId} className="relative rounded-lg overflow-hidden border bg-black">
                                    <div className="w-full h-64 flex items-center justify-center text-gray-400">
                                        <Play size={48} />
                                    </div>
                                    <div className="absolute bottom-2 left-2 text-white text-sm truncate max-w-[80%]">{att.name}</div>
                                    {att.status === 'uploading' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                                            <Loader2 className="animate-spin" />
                                        </div>
                                    )}
                                    <button onClick={() => removeAttachment(att.tempId)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}

                            {/* Document Preview */}
                            {hasDocument && attachments.map(att => (
                                <div key={att.tempId} className="relative flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                                    <div className="bg-red-100 p-3 rounded text-red-600">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{att.name}</p>
                                        <p className="text-sm text-gray-500">{(att.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                                    </div>
                                    {att.status === 'uploading' && <Loader2 className="animate-spin text-gray-500" />}
                                    <button onClick={() => removeAttachment(att.tempId)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                                        <X size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer / Actions */}
                <div className="p-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Media Buttons */}
                        <div {...getRootProps()} className="flex items-center gap-2">
                            <input {...getInputProps()} />
                            <button
                                className={`p-2 rounded-full hover:bg-gray-100 text-blue-600 ${hasVideo || hasDocument ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={hasVideo || hasDocument}
                            >
                                <ImageIcon size={24} />
                            </button>
                            {/* Separate Input for specific types if desired, but Dropzone handles all. 
                                 We can simulate buttons by opening dropzone. 
                                 Actually, user wants specific constraints. 
                                 Ideally we have multiple dropzones or one dropzone that strictly filters 
                                 but the buttons imply intent. 
                                 Let's keep it simple: One dropzone area, buttons just trigger it.
                              */}
                        </div>

                        {/* We need separate handlers if we want to enforce type via button click, 
                             but dropzone is unified. 
                             Let's just show icons. */}
                        <button className={`p-2 rounded-full hover:bg-gray-100 text-green-600 ${hasImages || hasDocument ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={hasImages || hasDocument}>
                            <VideoIcon size={24} />
                        </button>
                        <button className={`p-2 rounded-full hover:bg-gray-100 text-orange-600 ${hasImages || hasVideo ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={hasImages || hasVideo}>
                            <FileText size={24} />
                        </button>

                        <div className="h-6 w-px bg-gray-300 mx-2" />

                        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                            <Smile size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePost}
                            disabled={!text.trim() && attachments.length === 0 || isPosting}
                            className={`px-6 py-2 rounded-full font-semibold text-white transition ${(!text.trim() && attachments.length === 0) || isPosting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePostModal;
