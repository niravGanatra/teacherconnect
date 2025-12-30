/**
 * Split Registration Page
 * Two-path landing for Educators and Institutions.
 */
import { Link } from 'react-router-dom';
import {
    AcademicCapIcon,
    BuildingOffice2Icon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function Register() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-800 mb-4">
                        Join Acad World
                    </h1>
                    <p className="text-xl text-slate-600">
                        India's Professional Network for Educators
                    </p>
                </div>

                {/* Split Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Educator Card */}
                    <Link
                        to="/register/educator"
                        className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 cursor-pointer"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <AcademicCapIcon className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-3">
                                I am an Educator
                            </h2>

                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Build your professional portfolio, discover teaching opportunities,
                                and upskill with faculty development programs.
                            </p>

                            <ul className="text-left text-sm text-slate-500 space-y-2 mb-6">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Create your teaching portfolio
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Browse & apply to faculty positions
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                    Access professional development courses
                                </li>
                            </ul>

                            <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-4 transition-all">
                                Get Started
                                <ArrowRightIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </Link>

                    {/* Institution Card */}
                    <Link
                        to="/register/institution"
                        className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 cursor-pointer"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BuildingOffice2Icon className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-3">
                                I am an Institution
                            </h2>

                            <p className="text-slate-600 mb-6 leading-relaxed">
                                Hire qualified faculty, train your staff with FDPs,
                                and grow your institution's brand presence.
                            </p>

                            <ul className="text-left text-sm text-slate-500 space-y-2 mb-6">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                    Post faculty job openings
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                    Access verified educator profiles
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                    Bulk buy training programs for staff
                                </li>
                            </ul>

                            <div className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-4 transition-all">
                                Get Started
                                <ArrowRightIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 mt-8">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
