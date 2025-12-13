import React from 'react';

function Dashboard() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stat Card 1 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Recipes</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">--</p>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Active Subscribers</h3>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">--</p>
                </div>

                {/* Action Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
                    <button className="bg-white text-emerald-700 px-4 py-2 rounded text-sm font-bold shadow hover:bg-emerald-50 w-full mb-2">
                        + New Recipe
                    </button>
                    <button className="bg-emerald-700 text-white border border-emerald-500 px-4 py-2 rounded text-sm w-full hover:bg-emerald-600">
                        Manage Media
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                <p className="text-gray-500 italic">No recent activity.</p>
            </div>
        </div>
    );
}

export default Dashboard;
