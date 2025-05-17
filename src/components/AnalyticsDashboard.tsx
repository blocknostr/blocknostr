import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export interface Game {
    id: string;
    name: string;
    description: string;
    creator: string;
    eventId: string;
    highScore?: number;
    playCount: number;
}

interface AnalyticsDashboardProps {
    games: Game[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ games }) => {
    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Game Statistics</h3>
            {games.map((game) => {
                const chartData = {
                    labels: Array.from({ length: game.playCount }, (_, i) => `Play ${i + 1}`),
                    datasets: [
                        {
                            label: 'Scores Over Time',
                            data: Array.from({ length: game.playCount }, () => Math.floor(Math.random() * (game.highScore || 100))),
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        },
                    ],
                };

                return (
                    <div key={game.id} className="bg-gray-700 p-4 rounded-lg">
                        <h4 className="text-lg font-bold text-cyan-400">{game.name}</h4>
                        <p className="text-gray-300">High Score: {game.highScore || 'N/A'}</p>
                        <p className="text-gray-300">Total Plays: {game.playCount}</p>
                        <p className="text-gray-300">Creator: {game.creator.slice(0, 10)}...</p>
                        <div className="mt-4 h-32 bg-gray-800 rounded-lg">
                            <Line data={chartData} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AnalyticsDashboard;
