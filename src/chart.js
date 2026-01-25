import {CategoryScale, Chart, LinearScale, LineController, LineElement, PointElement} from 'chart.js';
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const { AttachmentBuilder, Client } = require('discord.js');

const db = require('./database')


Chart.register([
  CategoryScale,
  LineController,
  LineElement,
  LinearScale,
  PointElement
]);

function range(size, startAt = 0) {
    return [...Array(size).keys()].map(i => i + startAt);
}

export async function createChart(playerID){
    let eloHistory = await db.getPlayerEloHistory(playerID);

    const canvas = createCanvas(300, 200)
    const ctx = canvas.getContext('2d')
    const chart = new Chart(
        canvas,
        {
            type: 'line',
            data: {
                labels: range(eloHistory.length, 0),
                datasets: [{
                    label: 'ELO',
                    data: eloHistory,
                    borderColor: 'red'
                }]
            }
        }
    );
    
    const pngBuffer = await canvas.encode('png');
    
    const graph = new AttachmentBuilder(pngBuffer, { name: 'chart.png' });

    return graph;
}
