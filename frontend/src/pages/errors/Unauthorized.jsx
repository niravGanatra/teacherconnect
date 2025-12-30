/**
 * Unauthorized Page (403)
 * Displayed when user tries to access a resource they don't have permission for.
 */
import { Link } from 'react-router-dom';
import { ShieldExclamationIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                    <ShieldExclamationIcon className="w-10 h-10 text-red-600" />
                </div>

                <h1 className="text-6xl font-bold text-slate-800 mb-2">403</h1>
                <h2 className="text-2xl font-semibold text-slate-700 mb-4">
                    Access Denied
                </h2>

                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    You don't have permission to access this page.
                    Please contact your administrator if you believe this is an error.
                </p>

                <div className="flex gap-4 justify-center">
                    <Link
                        to="/feed"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <HomeIcon className="w-5 h-5" />
                        Go Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
