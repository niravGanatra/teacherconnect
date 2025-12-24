/**
 * Registration Page
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/common';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        password_confirm: '',
        user_type: 'TEACHER',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.password_confirm) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        const result = await register(formData);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 py-12 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#1e3a5f] to-[#3b5998] rounded-2xl mb-4">
                        <span className="text-2xl font-bold text-white">TC</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                    <p className="text-slate-500 mt-1">Join the teacher community today</p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* User Type Selection */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                                I am a
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, user_type: 'TEACHER' }))}
                                    className={`
                    p-4 rounded-lg border-2 text-center transition-all
                    ${formData.user_type === 'TEACHER'
                                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }
                  `}
                                >
                                    <div className="text-2xl mb-1">👨‍🏫</div>
                                    <div className="font-medium">Teacher</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, user_type: 'INSTITUTION' }))}
                                    className={`
                    p-4 rounded-lg border-2 text-center transition-all
                    ${formData.user_type === 'INSTITUTION'
                                            ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                        }
                  `}
                                >
                                    <div className="text-2xl mb-1">🏫</div>
                                    <div className="font-medium">Institution</div>
                                </button>
                            </div>
                        </div>

                        <Input
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            name="password_confirm"
                            value={formData.password_confirm}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                        />

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full"
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#1e3a5f] font-medium hover:underline">
                            Sign in
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
