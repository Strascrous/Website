import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master';
const OUTPUT = fileURLToPath(new URL('../src/data/outlines.fr.json', import.meta.url));

const METROPOLE = {
    url: `${BASE}/metropole-version-simplifiee.geojson`,
    tolerance: 0.02,
    minArea: 0.01,
};

const OVERSEAS = [
    { id: 'guadeloupe', name: 'Guadeloupe', file: '971-guadeloupe' },
    { id: 'martinique', name: 'Martinique', file: '972-martinique' },
    { id: 'guyane', name: 'Guyane', file: '973-guyane' },
    { id: 'reunion', name: 'La Réunion', file: '974-la-reunion' },
    { id: 'mayotte', name: 'Mayotte', file: '976-mayotte' },
];

// Tolérance relative à la taille du territoire (chaque encart a sa propre échelle)
const OVERSEAS_TOLERANCE = 0.008;
// Un anneau est gardé s'il fait au moins 1 % de la plus grande île du territoire
const OVERSEAS_MIN_AREA_RATIO = 0.01;

const PRECISION = 3;

const area = (ring) => {
    let sum = 0;
    for (let i = 0; i < ring.length - 1; i++) {
        sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return Math.abs(sum) / 2;
};

// Douglas-Peucker
const simplify = (points, epsilon) => {
    if (points.length < 3) return points;

    const [ax, ay] = points[0];
    const [bx, by] = points[points.length - 1];
    const dx = bx - ax;
    const dy = by - ay;
    const length = Math.hypot(dx, dy);

    let maxDistance = 0;
    let index = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const [px, py] = points[i];
        const distance = length > 0
            ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / length
            : Math.hypot(px - ax, py - ay);
        if (distance > maxDistance) {
            maxDistance = distance;
            index = i;
        }
    }

    if (maxDistance <= epsilon) return [points[0], points[points.length - 1]];

    return [
        ...simplify(points.slice(0, index + 1), epsilon).slice(0, -1),
        ...simplify(points.slice(index), epsilon),
    ];
};

const round = (ring) => ring.map(([lon, lat]) => [+lon.toFixed(PRECISION), +lat.toFixed(PRECISION)]);

const outerRings = (geojson) => {
    const geometry = geojson.geometry ?? geojson.features?.[0]?.geometry ?? geojson;
    const polygons = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
    return polygons.map((polygon) => polygon[0]);
};

const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText} — ${url}`);
    return response.json();
};

const metropole = outerRings(await fetchJson(METROPOLE.url))
    .filter((ring) => area(ring) >= METROPOLE.minArea)
    .map((ring) => round(simplify(ring, METROPOLE.tolerance)));

const overseas = await Promise.all(
    OVERSEAS.map(async ({ id, name, file }) => {
        const rings = outerRings(await fetchJson(`${BASE}/departements/${file}/departement-${file}.geojson`));

        const points = rings.flat();
        const lons = points.map((p) => p[0]);
        const lats = points.map((p) => p[1]);
        const span = Math.max(Math.max(...lons) - Math.min(...lons), Math.max(...lats) - Math.min(...lats));
        const biggest = Math.max(...rings.map(area));

        return {
            id,
            name,
            rings: rings
                .filter((ring) => area(ring) >= biggest * OVERSEAS_MIN_AREA_RATIO)
                .map((ring) => round(simplify(ring, span * OVERSEAS_TOLERANCE))),
        };
    })
);

const json = JSON.stringify({ metropole, overseas });
await writeFile(OUTPUT, json);

const count = (rings) => rings.reduce((n, r) => n + r.length, 0);
console.log(`✓ ${OUTPUT} (${(json.length / 1024).toFixed(1)} Ko)`);
console.log(`  métropole : ${metropole.length} anneaux, ${count(metropole)} points`);
for (const o of overseas) console.log(`  ${o.name} : ${o.rings.length} anneaux, ${count(o.rings)} points`);
